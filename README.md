
# BlockChan Live Instances:

	http://blockchan.ca | http://blockchan.link
	
  Developer's Twitter: https://twitter.com/ind_imm

  BlockChan Canada Twitter: https://twitter.com/blockchan_ca

# Run BlockChan Locally

    This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.2.2.

    Clone this repo: https://github.com/milezzz/BlockChan.git

    Install Angular CLI: npm install -g @angular/cli
    
    You must then run: npm install --save-dev @angular-devkit/build-angular

    Install Dependencies: npm install

    Run Locally: ng serve

    Navigate to `http://localhost:4200/`

## Put your client live on the internet with an nginx reverse proxy
    It's easy just add lines like this to your nginx vhost conf in /etc/nginx/sites-available/
    
    #We don't need no stinky web logs (optional)
    access_log  /dev/null;
    error_log /dev/null;
    
    #proxy part (required)
    location / {
        proxy_pass http://localhost:4200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    If you choose to run on Apache2, then edit /etc/apache2/apache2.conf to be as follows:
    <Directory />
        Options FollowSymLinks
        AllowOverride ALL
        Require all denied
    </Directory>

    <Directory /usr/share>
            AllowOverride ALL
            Require all granted
    </Directory>

    <Directory /var/www/>
            Options Indexes FollowSymLinks
            AllowOverride ALL
            Require all granted
    </Directory>

    You will also need to add a .htaccess file to your root web server directory (typically /var/www/html) that contains the line:

    ErrorDocument 404 /index.html

    You should also of course install SSL with a free certificate via https://letsencrypt.org or purchase your own.

## How does BlockChan work
    BlockChan works by storing content and references on the Ripple blockchain while storing actual images on IPFS referenced via hash. https://blockchan.ca/about

## Donate

    BTC: 133TGUYB2xPQ3cUATfDkK4zjv6y4Mrtn11
