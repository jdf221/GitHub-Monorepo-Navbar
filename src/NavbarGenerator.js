class NavbarGenerator {
  generate(allPackages) {
    if (!allPackages) return "";

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
        class="${
          document.querySelector(".d-none.d-sm-block") ? "" : "selected"
        } UnderlineNav-item hx_underlinenav-item no-wrap"
        href="${document.querySelector("strong[itemprop='name'] a").href}"
      >
        <svg
          aria-label="Directory"
          class="octicon octicon-file-directory text-color-icon-directory mr-3"
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

    let workspacesHtml = "";
    let packagesHtml = "";

    if (Object.keys(allPackages).length === 1) {
      for (const packageInfo of Object.values(allPackages)[0]) {
        if (!allPackages[packageInfo.name]) {
          packagesHtml += this.generateSimpleListElement(packageInfo);
        }
      }
    } else {
      for (const groupName of Object.keys(allPackages)) {
        if (groupName === "packages") {
          for (const packageInfo of allPackages[groupName]) {
            if (!allPackages[packageInfo.name]) {
              packagesHtml += this.generateSimpleListElement(packageInfo);
            }
          }
        } else {
          workspacesHtml += this.generateSlideOpenListElement(
            groupName,
            allPackages[groupName]
          );
        }
      }
    }

    generatedHtml += workspacesHtml + packagesHtml + "</ul></nav>";

    return generatedHtml;
  }

  generateSimpleListElement(packageObject, parentWorkspace) {
    return `<li class="d-flex ${
      parentWorkspace
        ? 'monorepo-navbar-workspace-item" hidden data-monorepo-navbar-parent-workspace="' +
          parentWorkspace
        : ""
    }"><a class="${
      packageObject.url === location.href ? "selected" : ""
    } js-navigation-open UnderlineNav-item hx_underlinenav-item no-wrap px-2" href="${
      packageObject.url
    }">
        <svg class="octicon octicon-package mr-1" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M8.878.392a1.75 1.75 0 00-1.756 0l-5.25 3.045A1.75 1.75 0 001 4.951v6.098c0 .624.332 1.2.872 1.514l5.25 3.045a1.75 1.75 0 001.756 0l5.25-3.045c.54-.313.872-.89.872-1.514V4.951c0-.624-.332-1.2-.872-1.514L8.878.392zM7.875 1.69a.25.25 0 01.25 0l4.63 2.685L8 7.133 3.245 4.375l4.63-2.685zM2.5 5.677v5.372c0 .09.047.171.125.216l4.625 2.683V8.432L2.5 5.677zm6.25 8.271l4.625-2.683a.25.25 0 00.125-.216V5.677L8.75 8.432v5.516z"></path></svg>
        <span>${packageObject.name}</span>
      </a></li>`;
  }

  generateSlideOpenListElement(groupName, packageGroupObject) {
    let htmlList = `<li  class="monorepo-navbar-workspace-open d-flex" data-monorepo-navbar-parent-workspace="${groupName}"><a class="${
      location.href.includes(groupName) ? "selected" : "'"
    } UnderlineNav-item hx_underlinenav-item no-wrap px-2" style="cursor: pointer;">
        <svg aria-label="Directory" class="octicon octicon-file-directory text-color-icon-directory mr-1" height="16" viewBox="0 0 16 16" version="1.1" width="16" role="img"><path fill-rule="evenodd" d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3h-6.5a.25.25 0 01-.2-.1l-.9-1.2c-.33-.44-.85-.7-1.4-.7h-3.5z"></path></svg>
        <span>${groupName}</span>
      </a></li>`;

    htmlList += this.generateSimpleListElement(
      {
        name: "/",
        url: packageGroupObject[0]?.url?.split("/")?.slice(0, -1)?.join("/"),
      },
      groupName
    );

    for (const packageInfo of packageGroupObject) {
      htmlList += this.generateSimpleListElement(packageInfo, groupName);
    }

    htmlList += `<li class="monorepo-navbar-workspace-item monorepo-navbar-workspace-close d-flex" hidden data-monorepo-navbar-parent-workspace="${groupName}"><a data-monorepo-parent-workspace="${groupName}" class="UnderlineNav-item hx_underlinenav-item no-wrap px-2" style="cursor: pointer;">
        <svg class="octicon octicon-tab" style="transform: rotate(180deg)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M22 4.25a.75.75 0 00-1.5 0v15a.75.75 0 001.5 0v-15zm-9.72 14.28a.75.75 0 11-1.06-1.06l4.97-4.97H1.75a.75.75 0 010-1.5h14.44l-4.97-4.97a.75.75 0 011.06-1.06l6.25 6.25a.75.75 0 010 1.06l-6.25 6.25z"></path></svg>
      </a></li>`;

    return htmlList;
  }
}
