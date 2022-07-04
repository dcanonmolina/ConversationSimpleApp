const urlToken = "/createToken";
$(document).ready(function(){

    let clientConversations = null;
    let conversationSid = null;
    $("#join").click(function(){
        let token = $("#token").val();
        const url = `${urlToken}?identity=${encodeURIComponent(token)}`

        if(token){
            axios.get(url)
                .then(resp => {
                        let tok = resp.data.token;
                        Twilio.Conversations.Client.create(tok)
                        .then(client => {
                            console.log("you are now logged to ")
                            clientConversations = client;
                            client.getSubscribedConversations()
                                .then(data => populateMyChannel(data))
                                .catch(err => console.error(err));


                            client.getSubscribedUsers()
                                    .then(users => {
                                        console.log('Getting subscribed users');
                                        users.forEach(user =>{
                                            console.log("user subscribed " + user.identity);
                                            user.on('updated',(data) =>{
                                                if(data.UserUpdateReason.includes('reachabilityOnline')){
                                                    console.log('user ' + data.user.identity + ' is ' + (data.user.isOnline ? " online": "out"));
                                                }
                                            });
                                       
                                        });
                                    });


                            client.on('connectionStateChanged', (state)=> {
                                console.log("Conversation client is " + state);
                            });

                            client.on('connectionError', (data)=> {
                                console.log(data);
                                console.log("Connection error " + data.message);
                                console.log("httpStatusCode " + data.httpStatusCode);
                            });

                            client.on('conversationJoined', (conversation)=>{
                                console.log("pre log: " + conversation.sid + ' '+conversation.uniqueName);
                            });

                        })
                        .catch(err => console.error(err));
                })
                .catch(err => console.error(err));


        }


    });

    $("#startConversation").click(function(){
        let conversation = $("#connectConversation").val();

        if(conversation && clientConversations){

            if (conversation.startsWith("CH")){
                clientConversations.getConversationBySid(conversation)
                    .then(conv => { conversationSid = conv;
                                    console.log(conversationSid.sid + " is started");
                                    console.log("create by " + conversationSid.createdBy );
                                    printMessages(conversationSid)
                                    console.log("status " + conv.status);
                                    conv.on('messageAdded', (message) =>{
                                        console.log(message.body)
                                    })
                                })
                    .catch(err => console.error(err));
            }
            else{
                clientConversations.getConversationByUniqueName(conversation)
                    .then(conv => { conversationSid = conv;
                                    console.log(conversationSid.sid + " is started");
                                    console.log("create by " + conversationSid.createdBy );
                                    printMessages(conversationSid)
                                    console.log("status " + conv.status);
                                    conv.on('messageAdded', (message) =>{
                                        console.log(message.body)
                                    })
                                })
                    .catch(err => console.error(err));
            }
        }
    });

    $("#send").click(function(){
        if(conversationSid){
            let conversation = $("#messageContent").val();
            conversationSid.sendMessage(conversation)
                            .then(m => console.log("messge idx "+ m))
                            .catch(err => console.error(err));
        }
    });

    $("#createConversation").click(function(){
        if(clientConversations){
            let conversationName = $("#conversationUnique").val();

            clientConversations.createConversation({
                uniqueName:conversationName,
                friendlyName:conversationName
            })
            .then(conv => {
                conversationSid = conv;
                console.log("you've created " + conv.uniqueName);
                
                if(confirm("Do you want to join the conversation?")){
                    conv.join()
                        .then(m=> console.log("you were added to " + m.uniqueName))
                        .catch(err => console.error(err));
                }
            })
            .catch(err => console.error(err));
        }
    });

    $("#getUnreadConversations").click(function(){
        conversationSid.getUnreadMessagesCount()
            .then(number => console.log("unread messages: "+ number) )
    });

    $("#setAllUnreadConversations").click(function(){
        conversationSid.setAllMessagesUnread()
            .then(number => console.log("set unread messages: "+ number) )
    });

    $("#setAllReadConversations").click(function(){
        conversationSid.setAllMessagesRead()
            .then(number => console.log("set all read messages: "+ number) )
    });

    $("#disconnect").click(function(){
        if(clientConversations){
             clientConversations.shutdown()
                .then(()=> console.log('session ended'));
        }
    });

    $("#getUserInfo").click(function(){
        if(clientConversations){
            let userName = $("#userIdentity").val();
            clientConversations.getUser(userName)
                    .then(user => {
                        user.on('updated',(data) =>{
                            if(data.updateReasons.includes('reachabilityOnline')){
                                console.log('user ' + data.user.identity + ' is ' + (data.user.isOnline ? " online": "out"));
                            }
                        });
                    });
        }
    });
});


function populateMyChannel(data){

    if(data.items){

      for(let i=0; i<data.items.length; i++)
      {
        let val = data.items[i].sid;
        let txt = data.items[i].friendlyName;
        let privacy = data.items[i].uniqueName;

        console.log(txt, val, privacy)
    
      }

    }

  }

function printMessages(conversation){
    conversation.getMessages()
                .then(p => {
                    p.items.forEach(element => {
                        console.log(element.index + ' - ' + element.dateCreated + ' - ' + element.body)
                    });
                })
}