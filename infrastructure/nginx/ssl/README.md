# SSL Certificates

This directory should contain your SSL certificates for production deployment.

## Required Files:
- `cert.pem` - SSL certificate
- `key.pem` - Private key

## For Development:
You can generate self-signed certificates using:

```bash
# Generate private key
openssl genrsa -out key.pem 2048

# Generate certificate signing request
openssl req -new -key key.pem -out cert.csr

# Generate self-signed certificate
openssl x509 -req -days 365 -in cert.csr -signkey key.pem -out cert.pem
```

## For Production:
- Use certificates from a trusted Certificate Authority (CA)
- Consider using Let's Encrypt for free SSL certificates
- Ensure certificates are properly secured and have appropriate permissions

## Security Notes:
- Never commit actual certificates to version control
- Use proper file permissions (600 for private keys)
- Regularly renew certificates before expiration