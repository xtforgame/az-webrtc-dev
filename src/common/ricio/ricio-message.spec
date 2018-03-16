/*
// a light message must have (at least) these attributes :

01. protocol: the name of the protocol which receive the message ('http' or 'ws' or ....)
02. method: the action to the target resource
03. path: the path of the target resource
04. url: the url of the target resource (usually as same as the path)
05. msgId: (It can be null or empty)
06. status: (for http, "200")
07. lightMsg: the one-line (*<TEXT, excluding CR, LF>) light-weight message (for http, "OK" (as a reason-phrase). for ws, it can be used for providing the reason like http does or a custom light-weight message)
08. headers: (It can be empty)
09. body: (It can be empty)
10. params: params parsed from path or url, the default value is {}
11. query: parsed query (may not only from path or url), the default value is {}
12. local: {} (a storage for carrying temp/local variables across routes)
13. peerInfo: {} (for saving the peer information we need)

*/
