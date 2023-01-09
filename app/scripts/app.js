var client;

init();

async function init() {
  client = await app.initialized();
  client.events.on('app.activated', initUi);
}


//Set text in ticket view sidebar window.
const initUi = () => document.getElementById('info').innerHTML = "Ready!"

// Open the calling modal. It is not possible to interact with the Ticket ui whilst the modal is open.
// Consider providing notes input field that the agents can pass notes back to the ticket with.

const fetchSendbirdUserCredentials = async (sendbirdUserId) => {
    try {
        //Get Agents user details from Sendbird
        const data = await client.request.invoke("getAgentsSendbirdCreds", { sendbirdUserId })
        //Attached agents's sendbird access_token to the data to be passed to the modal.
        return { sendbirdUserId, access_token: JSON.parse(data.response.response).access_token }
    } catch (e) {
        console.log(e.message)
        throw Error(e)
    }
}

const collectDataToPassToModal = async () => {

    //Get current user/agent's details for fetching Sendbird Credentials and passing to the calls modal.
    const agentData = await  client.data.get('loggedInUser'); //https://developers.freshdesk.com/v2/docs/data-methods/#loggedInUser
    const ticketCreatorData = await client.data.get('contact'); //https://developers.freshdesk.com/v2/docs/data-methods/#contactAPI

    //Any unique identifier from the agent can be used in Sendbird.
    //Additionally, it would be possible at this point to create the user in Sendbird.
    //Here we only fetch the user but you could try to fetch the user and if that fails create a new user using the server.js functions.
    const sendbirdUser = await fetchSendbirdUserCredentials(agentData.loggedInUser.org_agent_id) //https://sendbird.com/docs/chat/v3/platform-api/user/listing-users/get-a-user#1-get-a-user

    return {agentData, ticketCreatorData, sendbirdUser}
}

const openModal = async () => {

    client = await app.initialized();
    const dataToPassToModal = await collectDataToPassToModal()
    console.log(dataToPassToModal)
    //Open calls modal and send data to the modal.
    client.interface.trigger("showModal", {
        title: "Sendbird fallback service",
        template: "./modal.html",
         data: dataToPassToModal
    }).then(async function(data) {
        console.log(data)
        //Data was sent to the modal.
    }).catch(function(error) {
        console.log(error)
        throw Error(error)
        // error - error object
    });
}


