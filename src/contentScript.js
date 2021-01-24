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

    thisPage.addMonorepoNavbar(navbarGenerator.generate(allPackages));
  }
}

document.body.addEventListener(
  "click",
  (event) => {
    event.path.forEach((element) => {
      if (element?.classList?.contains("monorepo-navbar-workspace-open")) {
        [
          ...document.querySelectorAll(
            ".monorepo-navbar-workspace-item[data-monorepo-navbar-parent-workspace='" +
              element.getAttribute("data-monorepo-navbar-parent-workspace") +
              "']"
          ),
        ].forEach((element) => {
          element.toggleAttribute("hidden");
        });
      }

      if (element?.classList?.contains("monorepo-navbar-workspace-close")) {
        [
          ...document.querySelectorAll(
            ".monorepo-navbar-workspace-item[data-monorepo-navbar-parent-workspace='" +
              element.getAttribute("data-monorepo-navbar-parent-workspace") +
              "']"
          ),
        ].forEach((element) => {
          element.setAttribute("hidden", "");
        });
      }
    });
  },
  false
);

function handlePageLoad() {
  let checkCount = 0;
  let checkingInterval = setInterval(() => {
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

handlePageLoad();

let loadingState = false;
const observer = new MutationObserver((mutationRecords) => {
  mutationRecords.forEach((mutation) => {
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
  });
});

// observe everything except attributes
observer.observe(
  document.querySelector(
    ".progress-pjax-loader.width-full.js-pjax-loader-bar.Progress.position-fixed"
  ),
  {
    attributes: true,
  }
);
