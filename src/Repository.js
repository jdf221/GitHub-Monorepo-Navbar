class Repository {
  constructor(page) {
    this.page = page;
    this.name = this.page.repositoryNameElement?.getAttribute("content");
    this.homePageLink = "/" + this.name;
    this.latestCommitTimestamp = new Date(
      this.page.latestCommitElement
        ?.querySelector("relative-time")
        ?.getAttribute("datetime")
    ).getTime();
  }

  async getWorkspaceGlobs() {
    let workspaceGlobs = [];

    let homepageDocument = document;
    if (!this.page.isOnRepositoryHomepage) {
      const parser = new DOMParser();
      const homepageHtml = await fetch(this.homePageLink).then((response) =>
        response.text()
      );
      homepageDocument = parser.parseFromString(homepageHtml, "text/html");
    }

    if (
      homepageDocument.querySelector(
        "div[aria-labelledby='files'] div[role='rowheader'] a[title='lerna.json']"
      )
    ) {
      workspaceGlobs = await this.getFileContent("lerna.json").then(
        (content) => JSON.parse(content).packages
      );
    } else if (
      homepageDocument.querySelector(
        "div[aria-labelledby='files'] div[role='rowheader'] a[title='nx.json']"
      )
    ) {
      workspaceGlobs = await this.getFileContent("nx.json").then((content) => {
        let finalWorkspaces = [];
        const config = JSON.parse(content);

        finalWorkspaces.push(
          (config?.workspaceLayout?.appsDir || "apps") + "/*"
        );
        finalWorkspaces.push(
          (config?.workspaceLayout?.libsDir || "libs") + "/*"
        );

        return finalWorkspaces;
      });
    } else if (
      homepageDocument.querySelector(
        "div[aria-labelledby='files'] div[role='rowheader'] a[title='package.json']"
      )
    ) {
      workspaceGlobs = await this.getFileContent("package.json").then(
        (content) => JSON.parse(content).workspaces
      );
    }

    if (!workspaceGlobs || workspaceGlobs.length === 0) {
      return [];
    }

    let normalizedWorkspaceGlobs = [];

    // Goal is for the path to look like this: `path/to/packages/*`
    for (const globPath of workspaceGlobs) {
      let normalizedPath = globPath;

      // Removes leading slash
      if (normalizedPath.charAt(0) === "/") {
        normalizedPath = normalizedPath.slice(1);
      }
      // Removes ending slash
      if (normalizedPath.slice(-1) === "/") {
        normalizedPath = normalizedPath.slice(0, -1);
      }

      normalizedWorkspaceGlobs.push(normalizedPath);
    }

    return normalizedWorkspaceGlobs;
  }

  // TODO: May need to support /**/* and wildcards in names `packages/ext-*`
  async getAllPackages() {
    let allPackages = {};
    // Currently not doing anything with the glob stuff so just having the base path is easier
    const workspacePaths = (await this.getWorkspaceGlobs()).map(
      (workspaceGlob) => {
        return workspaceGlob.slice(0, workspaceGlob.lastIndexOf("/"));
        // let searchPattern = workspaceGlob.slice(lastSlashIndex + 1);
      }
    );

    for (const workspacePath of workspacePaths) {
      for (const fileInfo of await this.getDirectoryContent(workspacePath)) {
        if (fileInfo.type !== "dir") continue;
        // Ignores a dir that is listed as a workspace
        if (workspacePaths.includes(fileInfo.path)) continue;
        if (!allPackages[workspacePath]) {
          allPackages[workspacePath] = [];
        }

        allPackages[workspacePath].push({
          name: fileInfo.name,
          url: fileInfo.html_url,
        });
      }
    }

    return allPackages;
  }

  async getFileContent(path) {
    return fetch(`https://api.github.com/repos/${this.name}/contents/${path}`)
      .then((data) => data.json())
      .then((json) => atob(json.content));
  }

  async getDirectoryContent(path) {
    return fetch(
      `https://api.github.com/repos/${this.name}/contents/${path}`
    ).then((data) => data.json());
  }
}
