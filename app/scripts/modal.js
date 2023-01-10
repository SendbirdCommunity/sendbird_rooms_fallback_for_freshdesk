// Declare variables that will be used later in the code
var roomId;
var client;
var callee;
var sendbirdUser;

(async () => {
        client = await app.initialized()
        const context = await client.instance.context()

        callee = context.data.ticketCreatorData.contact
        agent = context.data.agentData.loggedInUser
        sendbirdUser = context.data.sendbirdUser

        // Update the UI with information about the callee and agent
        updateUiDetailsText()
        //Init Sendbird calls
        initSendbirdCalls()
})()

const updateUiDetailsText = () => {
    document.getElementById("details")
        .innerHTML = `This service will use a service user with the id - service_user_${callee.id}. 
        \n The suffixed number is ${callee.name}'s id number.
        \n Using a service user prevents exposure of regular credentials`
}

// Initialize the Sendbird Calls library and authenticate the user
async function initSendbirdCalls() {
    // Initialize the library with a given appId
    SendBirdCall.init("YOUR_APP_ID");
    // Set the logger level to INFO
    SendBirdCall.setLoggerLevel(SendBirdCall.LoggerLevel.INFO);
    try {
        // Authenticate the user with a given userId and accessToken
        await SendBirdCall.authenticate({
            userId: sendbirdUser.sendbirdUserId,
            accessToken: sendbirdUser.access_token
        });
    } catch (error) {
        throw Error(error);
    }
}

const createUrl = async () => {

    // Fetch context and service_user_id
    const context = await client.instance.context()
    const service_user_id = `service_user_${context.data.ticketCreatorData.contact.id}`
    // Fetch room_id and other information from a "buildBackupGroupCallUrl" request
    const data = await client.request.invoke("buildBackupGroupCallUrl", {userId: service_user_id} )


    /* Modal of returned data.response.
        {
            "service_user_id": "service_user_150006383534",
            "room_id": "b1650746-e810-4aeb-ae2a-422d8a42523c",
            "app_id": "885C2616-DBF8-4BDC-9178-4A1A662614E3",
            "creds": {
                "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1IjozNzg2MzQ5ODksInYiOjEsImUiOjE2NzI5MDIzODh9.ZnFkOU4LuFnzaVLdwZH9VyX7blnzwfAxBVNZjYTG_ck",
                "expires_at": 1672902388000
            }
        }

     */
    roomId = data.response.room_id
    console.log(data.response)
    //An example fallback webapp can be found here - https://github.com/SendbirdCommunity/sendbird_rooms_fallback_web-app
    const url = `http://localhost:1234/?data=${btoa(JSON.stringify(data.response))}`
    document.getElementById('link').innerHTML = url
}


const addSendbirdCallsListener = (room) => {

    // Other room events are available. https://sendbird.com/docs/calls/v1/javascript/guides/group-call#2-handle-events-in-a-room-3-receive-events-on-enter-and-exit

    const target = document.getElementById('remote_video_target')


    room.on('remoteParticipantStreamStarted', (remoteParticipant) => {
        if(sendbirdUser.sendbirdUserId == remoteParticipant.user.userId) return

        const remoteMediaView = document.createElement('video');
        remoteMediaView.autoplay = true;
        remoteParticipant.setMediaView(remoteMediaView);
        target.appendChild(remoteMediaView);
    });
    room.on('remoteParticipantEntered', (remoteParticipant) => {
        console.log("remote participant entered")
    });
}



async function enterRoom () {

    //A Sendbird websocket is required in order to listen for real time updates from other Group Call participants.
    try {
        await SendBirdCall.connectWebSocket()
        console.log("connected to Sendbird")
    } catch(e) {
        console.log("connection failed:", e)
        return
    }
    try {
        //roomId was saved globally after it was created.
        const room = await SendBirdCall.fetchRoomById(roomId)

        const enterParams = {videoEnabled: false, audioEnabled: true};
        await room.enter(enterParams);
        addSendbirdCallsListener(room)
    } catch (e) {
        console.error(e)
    }
}

const endCall = () => outGoingCall.end()

