async function addMonorepoNavbar() {
  const monorepoInfoCache = new MonorepoInfoCache();
  const thisPage = new Page();
  const thisRepository = new Repository(thisPage);
  const navbarGenerator = new NavbarGenerator();

  if (thisPage.isRepository) {
    await monorepoInfoCache.load();

    const cachedRepositoryData = monorepoInfoCache.getCachedRepositoryData(
      thisRepository.name
    );

    let allPackages;
    if (cachedRepositoryData) {
      if (cachedRepositoryData.isNotMonorepo) return;
      if (
        !thisRepository.latestCommitTimestamp ||
        cachedRepositoryData.latestCommitTimestamp >=
          thisRepository.latestCommitTimestamp
      ) {
        allPackages = cachedRepositoryData.allPackages;
      }
    }

    if (
      !cachedRepositoryData ||
      !cachedRepositoryData.latestCommitTimestamp ||
      cachedRepositoryData.latestCommitTimestamp <
        thisRepository.latestCommitTimestamp
    ) {
      allPackages = await thisRepository.getAllPackages();

      if (Object.keys(allPackages).length === 0) {
        await monorepoInfoCache.markAsNonMonorepo(
          thisRepository.name,
          thisRepository.latestCommitTimestamp
        );

        return;
      }

      await monorepoInfoCache.setPackagesObject(
        thisRepository.name,
        thisRepository.latestCommitTimestamp,
        allPackages
      );
    }

    thisPage.addMonorepoNavbar(
      navbarGenerator.generate(allPackages, thisRepository.name.split("/")[1])
    );
  }
}

document.body.addEventListener(
  "click",
  (event) => {
    for (const element of event.composedPath()) {
      if (element?.classList?.contains("monorepo-navbar-workspace-open")) {
        for (const element of [
          ...document.querySelectorAll(
            `.monorepo-navbar-workspace-item[data-monorepo-navbar-parent-workspace='${element.getAttribute(
              "data-monorepo-navbar-parent-workspace"
            )}']`
          ),
        ]) {
          element.toggleAttribute("hidden");
        }
      }

      if (element?.classList?.contains("monorepo-navbar-workspace-close")) {
        for (const element of [
          ...document.querySelectorAll(
            `.monorepo-navbar-workspace-item[data-monorepo-navbar-parent-workspace='${element.getAttribute(
              "data-monorepo-navbar-parent-workspace"
            )}']`
          ),
        ]) {
          element.setAttribute("hidden", "");
        }
      }
    }
  },
  false
);

function handlePageLoad() {
  let checkCount = 0;
  const checkingInterval = setInterval(() => {
    if (
      document.querySelector("div[aria-labelledby='files']")?.children?.length >
        1 ||
      checkCount > 50
    ) {
      addMonorepoNavbar();
      clearInterval(checkingInterval);
    }
    checkCount++;
  }, 50);
}

if (location.href.includes("clearMonorepoNavbarCache=true")) {
  browser.storage.local.clear();
  console.log("GitHub Monorepo Navbar: Cache cleared!");
}

handlePageLoad();

let loadingState = false;
const observer = new MutationObserver((mutationRecords) => {
  for (const mutation of mutationRecords) {
    if (mutation.attributeName === "class") {
      if (mutation.target.classList.contains("is-loading")) {
        loadingState = true;
      } else {
        if (loadingState) {
          handlePageLoad();
        }

        loadingState = false;
      }
    }
  }
});

observer.observe(
  document.querySelector(
    ".progress-pjax-loader.width-full.js-pjax-loader-bar.Progress.position-fixed"
  ),
  {
    attributes: true,
  }
);
