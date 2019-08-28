const spotifyRouter = require('express').Router()
const SpotifyWebApi = require('spotify-web-api-node')
const axios = require('axios')

const createAuthenticatedSpotiffyApi = (access, refresh) => {
    let spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(access);
    spotifyApi.setRefreshToken(refresh);
    return spotifyApi;
}
const getFollowed = async (spotifyApi, aft) => {
    let options = { limit: 50 }
    if (aft) {
        options.after = aft
    }
    const response = await spotifyApi.getFollowedArtists(options);
    if (response.body.artists.next !== null) {
        return response.body.artists.items.concat(
            await getFollowed(spotifyApi, response.body.artists.cursors.after)
        );
    } else {
        return response.body.artists.items;
    }
};

const asyncTimeout = async (ms) => {
    await new Promise(resolve => setTimeout(resolve, ms));
}
const yksiRetrylla = async (id, retries, spotifyapi) => {
    let options = { album_type: 'album', country: 'FI', limit: 50 }
    let RETRY_INTERVAL = 10;
    try {
        const response = await spotifyapi.getArtistAlbums(id, options)
        return response;
    } catch (e) {
        if (retries > 0) {
            console.log(e)
            let s = (parseInt(e.headers['retry-after']) * 1000) + 1000;
            console.log(`Waiting for ${s}`)
            await asyncTimeout(
                e.headers['retry-after'] ?
                    (parseInt(e.headers['retry-after']) * 1000) + 1000 :
                    RETRY_INTERVAL
            );
            return await yksiRetrylla(id, retries - 1, spotifyapi);
        }
        throw e;
    }
}
const getArtistsAlbums = async (artistit, spotifyapi) => {

    const promises = await artistit.map(async (artist) => {
        const response = await yksiRetrylla(artist.id, 10, spotifyapi);

        artist.albums = response.body.items;
        return artist;
    })
    //   const albms = await Promise.all(promises)
    const resolved = await Promise.all(promises)
    return resolved;
}

spotifyRouter.get('/getFollowedArtistData', async (request, response, next) => {
    let spotifyapi = await createAuthenticatedSpotiffyApi(request.user.access_token, request.user.refresh_token)
    const artistit = await getFollowed(spotifyapi);
    const res = await getArtistsAlbums(artistit, spotifyapi);
    //  console.log(request.session)
    response.json(res)
})

spotifyRouter.post('/saveAlbumsToUser', async (request, response, next) => {
    let artist = request.body.albums
    let ida = []
    let albumIds = await artist.map((artist) => {
        artist.albums.map(alb => ida.push(alb.id))
    })
    let accessToken = request.user.access_token;
    let tok = "Bearer " + accessToken;
    let url = 'https://api.spotify.com/v1/me/albums?ids='
    const config = {
        headers: {
            'Authorization': tok,
            'Content-Type': 'application/json'
        }
    }
    console.log(`Trying to save ${ida.length} albums!`)
    if (ida.length < 20) {
        try {
            const resp = await axios.put(url, ida, config);
            console.log(resp.status);
        } catch (e) {
            console.log(e)
        }

    } else {
        var arrays = [], size = 20;

        while (ida.length > 0) {
            arrays.push(ida.splice(0, size));
        }
        arrays.map(async (array) => {
            try {
                const rsp = await axios.put(url, array, config)
                console.log(rsp.status)
            } catch (e) {
                console.log(e)
            }

        })
    }
    response.send("OK")
})


spotifyRouter.get('/getUsersFollowedArtists', async (request, response, next) => {
    let spotifyapi = await createAuthenticatedSpotiffyApi(request.user.access_token, request.user.refresh_token)
    try {
        const followedArtists = await getFollowed(spotifyapi);
        response.json(followedArtists)
    } catch (e) {
        next(e)
    }
})
spotifyRouter.get('/getUser', async (request, response, next) => {
    let spotifyapi = await createAuthenticatedSpotiffyApi(request.user.access_token, request.user.refresh_token)
    try {
        const user = await spotifyapi.getMe();
        response.json(user)
    } catch (e) {
        next(e)
    }
})

spotifyRouter.get('/followArtist/:id', async (request, response, next) => {
    let spotifyapi = await createAuthenticatedSpotiffyApi(request.user.access_token, request.user.refresh_token)
    try {
        const rsp = await spotifyapi.followArtists(request.params.id)
        response.json(rsp)

    } catch (e) {
        next(e)
    }
})
spotifyRouter.get('/ensureAuthenticated', async (request, response, next) => {
    response.send("Authenticated")
})
spotifyRouter.get('/unFollowArtist/:id', async (request, response, next) => {
    let spotifyapi = await createAuthenticatedSpotiffyApi(request.user.access_token, request.user.refresh_token)
    try {
        const response = await spotifyapi.unfollowArtists(request.params.id)

        response.json(response)

    } catch (e) {
        next(e)
    }
})



module.exports = spotifyRouter;