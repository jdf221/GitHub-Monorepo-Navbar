class MonorepoInfoCache {
  async load() {
    this._cacheObject =
      (await browser.storage.local.get("cachedMonorepoInfo"))
        .cachedMonorepoInfo || {};
  }

  getCachedRepositoryData(repositoryName) {
    return this._cacheObject[repositoryName];
  }

  async setPackagesObject(repositoryName, latestCommitTimestamp, allPackages) {
    this._cacheObject[repositoryName] = {
      latestCommitTimestamp: latestCommitTimestamp,
      allPackages: allPackages,
    };

    return this.save();
  }

  async markAsNonMonorepo(repositoryName, latestCommitTimestamp) {
    this._cacheObject[repositoryName] = {
      latestCommitTimestamp: latestCommitTimestamp,
      inNotMonorepo: true,
    };

    return this.save();
  }

  async save() {
    await browser.storage.local.set({
      cachedMonorepoInfo: this._cacheObject,
    });
  }
}
