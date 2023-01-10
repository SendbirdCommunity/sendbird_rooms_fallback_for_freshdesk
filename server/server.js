const APP_ID = 'YOUR_APP_ID'
const API_TOKEN = 'API_TOKEN'
const headers = {
    "Api-Token": API_TOKEN,
    "Content-Type": "application/json; charset=utf8"
}

class HTTPError extends Error {
    constructor({status, response}) {
        super(`HTTP request failed: ${status} ${statusText}`);
        this.response = response;
    }
}

const makePostCall = async (url, body) => {
    const result = await $request.post(url, {headers, body})
    return JSON.parse(result.response)
}

const fetchNewSendBirdSessionToken = async (userId) => {
    const url = `https://api-${APP_ID}.sendbird.com/v3/users/${userId}/token`
    const body = JSON.stringify({expires_at: Date.now() + 1000 * 60 * 60});
    return makePostCall(url, body)
}

const createNewSendbirdUser = async (userId) => {

    const url = `https://api-${APP_ID}.sendbird.com/v3/users`
    const body = JSON.stringify({user_id: userId, nickname: "", profile_url: ""});
    return makePostCall(url, body)
}

const createNewSendbirdGroupCallRoom = async (type = 'small_room_for_video') => {

    const url = `https://api-${APP_ID}.calls.sendbird.com/v1/rooms`
    const body = JSON.stringify({type});
    return makePostCall(url, body)
}

//exportable methods need to be registered in the manifest.json
//exported methods can be called from the client using  - await client.request.invoke("METHOD_NAME", {data: "data"} )
exports = {

    buildBackupGroupCallUrl: async function (data) {
        //Attempt to fetch a new token for the target user.
        const returnData = {
            "service_user_id": data.userId,
            "room_id": null,
            "app_id": APP_ID,
            "creds": {
                "token": null,
                "expires_at": null
            }
        }
        try {
            const userCredentials = await fetchNewSendBirdSessionToken(data.userId)
            if (userCredentials.token) returnData.creds = userCredentials
        } catch (e) {
            if (e.message == 'Request failed: {"error":true,"message":"\\"User\\" not found.","code":400201}') {
                //Create a new user.
                try {
                    const newUser = await createNewSendbirdUser(data.userId)
                    returnData.service_user_id = newUser.user_id
                } catch (e) {
                    renderData(e, null)
                }
                try {
                    const userCredentials = await fetchNewSendBirdSessionToken(data.userId)
                    if (userCredentials.token) returnData.creds = userCredentials
                } catch (e) {
                    renderData(e, null)
                }
            }
        }

        try {
            const newRoom = await createNewSendbirdGroupCallRoom()
            if (newRoom.room.room_id) returnData.room_id = newRoom.room.room_id
            renderData(null, returnData)
            return
        } catch (e) {
            returnData(e, null)
        }
    },

    getAgentsSendbirdCreds: function (user) {
        //Installation parameters protect Sendbird's API tokn - https://developers.freshdesk.com/v2/docs/installation-parameters/
        //Headers here use templating to pick up the iparam.api_token - https://developers.freshdesk.com/v2/docs/request-method/#sample_requests
        //See iparam.json for the settings
        //Here the api-token is hard coded - don't use this approach in production.
        $request.get(`https://api-${APP_ID}.sendbird.com/v3/users/${user.sendbirdUserId}` , {headers})
            .then(
                function (data) {
                    //handle "data"
                    //"data" is a json string with status, headers, and response.
                    renderData(null, data)
                },
                function (error) {
                    // var error = { status: 403, message: "Error while processing the request" };
                    renderData({message: JSON.stringify(error)});
                }
            )
    }
}




