class Page {
  constructor() {
    this.repositoryNameElement = document.querySelector(
      "meta[name='octolytics-dimension-repository_nwo']"
    );

    this.isRepository =
      this.repositoryNameElement?.getAttribute("content") &&
      document.querySelector("div[aria-labelledby='files']");
    this.isOnRepositoryHomepage =
      document.querySelector("h2.mb-3.h4")?.textContent === "About";

    if (this.isRepository) {
      this.latestCommitElement = document.querySelector(
        ".repository-content .Box"
      )?.children[0];
    }
  }

  addMonorepoNavbar(generatedHtml) {
    if (!document.querySelector(".monorepo-navbar")) {
      this.latestCommitElement.outerHTML =
        this.latestCommitElement.outerHTML + generatedHtml;
    }
  }
}
