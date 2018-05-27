openssl req -new -x509 -days 4000 -config config/root-ca.cnf -keyout root-ca.key -out root-ca.crt
openssl genrsa -out server.key 4096
openssl req -new -config config/server.cnf -key server.key -out server.csr
openssl x509 -req -extfile config/server.cnf -days 999 -passin "pass:password" -in server.csr -CA root-ca.crt -CAkey root-ca.key -CAcreateserial -out server.crt