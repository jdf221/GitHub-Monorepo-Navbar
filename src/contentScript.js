(async () => {
  const repositoryNameElement = document.querySelector(
    "meta[name='octolytics-dimension-repository_nwo']"
  );

  if (
    repositoryNameElement !== null &&
    document.querySelector("div[aria-labelledby='files']") !== null
  ) {
    const repositoryName = repositoryNameElement.getAttribute("content");

    const latestCommitElement = document.querySelector(
      ".repository-content .Box"
    ).children[0];

    const monorepoConfig = await getMonorepoConfig(repositoryName);
    if (!monorepoConfig) return;

    const allPackagesGroups = await getAllPackageGroups(
      repositoryName,
      monorepoConfig
    );
    if (!allPackagesGroups) return;

    let generatedNavHtml = `<nav class="monorepo-nav UnderlineNav pr-3 pr-md-4 pr-lg-5 bg-gray-light"><ul class="UnderlineNav-body list-style-none">`;

    let rootCasing = "R";
    const firstGroup = Object.values(allPackagesGroups)[0];
    if (
      firstGroup &&
      firstGroup[0] &&
      firstGroup[0].name === firstGroup[0].name.toLowerCase()
    ) {
      rootCasing = "r";
    }
    generatedNavHtml += `<li class="d-flex">
      <a class="selected UnderlineNav-item hx_underlinenav-item no-wrap" href="">
        <span>${rootCasing}oot</span>
      </a>
    </li>`;

    if (Object.keys(allPackagesGroups).length === 1) {
      for (const packageInfo of allPackagesGroups) {
        generatedNavHtml += createSimpleListElement(packageInfo);
      }
    } else if (Object.keys(allPackagesGroups).length > 1) {
      for (const groupName of Object.keys(allPackagesGroups)) {
        console.log(groupName);
        generatedNavHtml += createDropdownListElement(
          groupName,
          allPackagesGroups[groupName]
        );
      }
    }

    generatedNavHtml += `</ul></nav>`;

    latestCommitElement.outerHTML =
      latestCommitElement.outerHTML + generatedNavHtml;
  }
})();

async function getFileContent(repo, path) {
  return fetch(`https://api.github.com/repos/${repo}/contents/${path}`)
    .then((data) => data.json())
    .then((json) => atob(json.content));
}

async function getDirectoryListing(repo, path) {
  return fetch(
    `https://api.github.com/repos/${repo}/contents/${path}`
  ).then((data) => data.json());
}

async function getMonorepoConfig(repo) {
  let allFiles = [];
  let packagesPaths = [];

  for (const fileElement of document.querySelectorAll(
    "div[aria-labelledby='files'] div[role='rowheader'] a"
  )) {
    allFiles.push(fileElement.innerText);
  }

  if (allFiles.includes("lerna.json")) {
    packagesPaths = await getFileContent(repo, "lerna.json").then(
      (content) => JSON.parse(content).packages
    );
  } else if (allFiles.includes("package.json")) {
    packagesPaths = await getFileContent(repo, "package.json").then(
      (content) => JSON.parse(content).workspaces
    );
  }

  if (packagesPaths && packagesPaths.length === 0) {
    return false;
  } else {
    return packagesPaths;
  }
}

async function getAllPackageGroups(repo, monorepoConfig) {
  let packageGroupList = {};

  for (const path of monorepoConfig) {
    let realPath = path;

    if (realPath.charAt(0) === "/") {
      realPath = realPath.slice(1);
    }

    if (
      realPath.slice(-1) === "*" ||
      (realPath[realPath.length - 2] === "*" && realPath.slice(-1) === "/")
    ) {
      realPath = realPath.slice(0, -2);
    }

    for (const fileInfo of await getDirectoryListing(repo, realPath)) {
      const firstSlashIndex = fileInfo.path.indexOf("/");
      let groupName = fileInfo.path.substring(0, firstSlashIndex);
      let packageName = fileInfo.path.substring(firstSlashIndex + 1);

      if (!packageGroupList[groupName]) {
        packageGroupList[groupName] = [];
      }
      packageGroupList[groupName].push({
        url: fileInfo.html_url,
        name: packageName,
      });
    }
  }

  return packageGroupList;
}

/**
 * Dom related stuff
 */
const monorepoNavElement = document.querySelector(".monorepo-nav");
if (monorepoNavElement) {
  monorepoNavElement.addEventListener("click", (event) => {
    console.log(event);
    if (!event.target.classList.contains("monorepo-nav-dropdown-link")) {
      console.log("no");
      return;
    }

    event.target.parentElement.parentElement.parentElement.toggleAttribute(
      "open"
    );
  });
}

function createPackageLinkElement(packageObject) {
  return `<a class="UnderlineNav-item hx_underlinenav-item no-wrap">
        <span class="monorepo-nav-dropdown-link">${packageObject.name}</span>
      </a>`;
}

function createSimpleListElement(packageObject) {
  return `<li>` + createPackageLinkElement(packageObject) + `</li>`;
}

function createDropdownListElement(groupName, packageObject) {
  return `<li><details class="details-overlay details-reset">
    <summary role="button">
      ${groupName}
    </summary>
    <div>
      <details-menu role="menu" class="dropdown-menu dropdown-menu-sw">
        <ul>
          ${createPackageLinkElement(packageObject)}
        </ul>
      </details-menu>
    </div>
  </details></li>`;
}
