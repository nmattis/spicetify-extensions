// NAME: SaveDiscoverWeekly
// AUTHOR: nick_mattis
// VERSION 1.0
// DESCRIPTION: Save out Discover Weekly playlist

(function SaveDiscoverWeekly() {
    const DISCOVER_WEEKLY_CACHE = 'discover_weekly_cached';

    const fetchPlaylist = (uri) => new Promise((resolve, reject) => {
        Spicetify.BridgeAPI.cosmosJSON(
            {
                method: "GET",
                uri: `sp://core-playlist/v1/playlist/${uri}`,
                body: {
                    policy: {
                        link: true,
                    },
                },
            },
            (error, res) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(res);
            }
        );
    });

    const savePlaylist = () => new Promise((resolve, reject) => {
        const discoverWeekly = JSON.parse(Spicetify.LocalStorage.get(DISCOVER_WEEKLY_CACHE));
        let songUris = [];
        discoverWeekly.items.forEach(song => {
            songUris.push(song.link);
        });

        let currDate = new Date();
        const days = ((currDate.getDay() + 7) - 1) % 7;
        currDate.setDate(currDate.getDate() - days);
        const mondayOfTheWeek = currDate.toISOString().substring(0,10).replace(/-/g, '/');

        Spicetify.BridgeAPI.cosmosJSON(
            {
                method: 'POST',
                uri: `sp://core-playlist/v1/rootlist`,
                body: {
                    operation: 'create',
                    name: `Discover Weekly - ${mondayOfTheWeek}`,
                    playlist: true,
                    public: false,
                    uris: songUris,
                },
            },
            (error, res) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(res);
            }
        );
    });

    const saveContextMenu = new Spicetify.ContextMenu.Item(
        'Save Discover Weekly',
        () => {
            savePlaylist()
                .then(() => Spicetify.showNotification('Discover Weekly Saved!'))
                .catch((err) => Spicetify.showNotification(`${err}`));
        },
        () => { return true; }
    );

    Spicetify.Player.addEventListener("appchange", ({ data: data }) => {
        const uriObj = Spicetify.URI.fromString(data.uri);
        if (uriObj.id === Spicetify.URI.Type.PLAYLIST || uriObj.id === Spicetify.URI.Type.PLAYLIST_V2) {
            fetchPlaylist(`spotify:playlist:${uriObj.args[0]}`)
                .then((list) => {
                    if (list.playlist.name === 'Discover Weekly') {
                        saveContextMenu.register();
                        Spicetify.LocalStorage.set(DISCOVER_WEEKLY_CACHE, JSON.stringify(list));
                    } else {
                        // Need to wait for https://github.com/khanhas/spicetify-cli/pull/460 before this can be used
                        // saveContextMenu.deregister();
                    }
                })
                .catch((err) => Spicetify.showNotification(`${err}`));
        }
    });
})();
