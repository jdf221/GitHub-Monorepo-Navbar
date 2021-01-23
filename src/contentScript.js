"use strict";

const MonorepoInfoCache = new (class {
  _cacheObject = {};

  async load() {
    this._cacheObject = (
      await browser.storage.local.get("cachedMonorepoInfo")
    ).cachedMonorepoInfo;
  }

  getCachedRepositoryData(repositoryName) {
    return this._cacheObject[repositoryName];
  }

  async setPackagesObject(repositoryName, commitHash, allPackages) {
    this._cacheObject[repositoryName] = {
      commitHash: commitHash,
      allPackages: allPackages,
    };

    return this.save();
  }

  async markAsNonMonorepo(repositoryName, commitHash) {
    this._cacheObject[repositoryName] = {
      commitHash: commitHash,
      inNotMonorepo: true,
    };

    return this.save();
  }

  async save() {
    await browser.storage.local.set({
      cachedMonorepoInfo: this._cacheObject,
    });
  }
})();

const Repository = new (class {
  name = document
    .querySelector("meta[name='octolytics-dimension-repository_nwo']")
    ?.getAttribute("content");

  latestCommitHash = Page.latestCommitElement?.querySelector(
    ".flex-items-center .text-mono"
  )?.innerText;

  async getWorkspaceGlobs() {
    let workspaceGlobs = [];

    if (
      document.querySelector(
        "div[aria-labelledby='files'] div[role='rowheader'] a[title='lerna.json']"
      )
    ) {
      workspaceGlobs = await this.getFileContent("lerna.json").then(
        (content) => JSON.parse(content).packages
      );
    } else if (
      document.querySelector(
        "div[aria-labelledby='files'] div[role='rowheader'] a[title='package.json']"
      )
    ) {
      workspaceGlobs = await this.getFileContent("package.json").then(
        (content) => JSON.parse(content).workspaces
      );
    }

    if (workspaceGlobs.length === 0) {
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
    const workspacePaths = (await Repository.getWorkspaceGlobs()).map(
      (workspaceGlob) => {
        return workspaceGlob.slice(0, workspaceGlob.lastIndexOf("/"));
        // let searchPattern = workspaceGlob.slice(lastSlashIndex + 1);
      }
    );

    for (const workspacePath of workspacePaths) {
      for (const fileInfo of await this.getDirectoryContent(workspacePath)) {
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
})();

const NavbarGenerator = new (class {
  generate(allPackages) {
    let rootCasing = "R";
    const firstGroup = Object.values(allPackages)[0];
    if (
      firstGroup &&
      firstGroup[0] &&
      firstGroup[0].name === firstGroup[0].name.toLowerCase()
    ) {
      rootCasing = "r";
    }

    let generatedHtml = `
<nav class="monorepo-nav UnderlineNav pr-3 pr-md-4 pr-lg-5 bg-gray-light">
  <ul class="UnderlineNav-body list-style-none">
    <li class="d-flex">
      <a
        class="selected UnderlineNav-item hx_underlinenav-item no-wrap"
        href="${document.querySelector("strong[itemprop='name'] a").href}"
      >
        <svg
          aria-label="Directory"
          class="octicon octicon-file-directory text-color-icon-directory mr-1"
          height="16"
          viewBox="0 0 16 16"
          version="1.1"
          width="16"
          role="img"
        >
          <path
            fill-rule="evenodd"
            d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3h-6.5a.25.25 0 01-.2-.1l-.9-1.2c-.33-.44-.85-.7-1.4-.7h-3.5z"
          ></path>
        </svg>
        <span>${rootCasing}oot</span>
      </a>
    </li>
`;


  }
})();

const Page = new (class {
  latestCommitElement = document.querySelector(".repository-content .Box")
    ?.children[0];

  isRepository() {
    // Confirm we are on a repository page by checking if there is a repository name and a files div.
    return (
      Repository.name || document.querySelector("div[aria-labelledby='files']")
    );
  }

  addMonorepoNavbar(allPackages) {}

  expandWorkspace() {}

  collapseWorkspace() {}
})();

(async () => {
  if (await Page.isRepository()) {
    await MonorepoInfoCache.load();

    const cachedRepositoryData = MonorepoInfoCache.getCachedRepositoryData(
      Repository.name
    );

    let allPackages;
    if (cachedRepositoryData) {
      if (cachedRepositoryData.isNotMonorepo) return;
      if (cachedRepositoryData.commitHash === Repository.latestCommitHash) {
        allPackages = cachedRepositoryData.allPackages;
      }
    }

    if (
      !cachedRepositoryData ||
      cachedRepositoryData.commitHash !== Repository.latestCommitHash
    ) {
      allPackages = await Repository.getAllPackages();

      if (Object.keys(allPackages).length === 0) {
        await MonorepoInfoCache.markAsNonMonorepo(
          Repository.name,
          Repository.latestCommitHash
        );

        return;
      }

      await MonorepoInfoCache.setPackagesObject(
        Repository.name,
        Repository.latestCommitHash,
        allPackages
      );
    }

    console.log(allPackages);
  }
})();
