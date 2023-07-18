import http.server
import ssl
import os
 
os.system("openssl req -new -keyout server.pem -out server.pem -x509 -days 365 -nodes -subj '/CN=www.pubnub.com/O=PubNub/C=US'")
httpd = http.server.HTTPServer(('0.0.0.0', 4443), http.server.SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket(httpd.socket, certfile='./server.pem', server_side=True)
os.system("rm server.pem")
httpd.serve_forever()
