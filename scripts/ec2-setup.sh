#!/bin/bash
set -e

echo "========================================="
echo "  Headcount App - EC2 Setup Script"
echo "========================================="

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "Cannot detect OS. Exiting."
    exit 1
fi

echo ""
echo "Detected OS: $OS"
echo ""

# -------------------------------------------
# 1. Install system dependencies
# -------------------------------------------
echo "[1/7] Installing system dependencies..."

if [ "$OS" = "amzn" ]; then
    sudo dnf update -y
    sudo dnf install -y gcc-c++ make git nginx
    # Install Node.js 20 LTS via NodeSource
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
elif [ "$OS" = "ubuntu" ]; then
    sudo apt-get update -y
    sudo apt-get install -y build-essential git nginx
    # Install Node.js 20 LTS via NodeSource
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Unsupported OS: $OS. Please use Amazon Linux 2023 or Ubuntu 22.04."
    exit 1
fi

echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# -------------------------------------------
# 2. Install PM2
# -------------------------------------------
echo ""
echo "[2/7] Installing PM2..."
sudo npm install -g pm2

# -------------------------------------------
# 3. Clone the repository
# -------------------------------------------
APP_DIR="/home/$(whoami)/headcount-app"

echo ""
echo "[3/7] Cloning repository..."

if [ -d "$APP_DIR" ]; then
    echo "Directory $APP_DIR already exists. Pulling latest changes..."
    cd "$APP_DIR"
    git pull origin main
else
    git clone https://github.com/Louisss-Lam/headcount-app.git "$APP_DIR"
    cd "$APP_DIR"
fi

# -------------------------------------------
# 4. Install npm dependencies and build
# -------------------------------------------
echo ""
echo "[4/7] Installing dependencies..."
npm install

echo ""
echo "[5/7] Building the app..."
npm run build

# -------------------------------------------
# 5. Configure environment variables
# -------------------------------------------
echo ""
echo "[6/7] Configuring environment..."

if [ ! -f "$APP_DIR/.env" ]; then
    echo ""
    echo "Do you want to configure AWS SES for email notifications? (y/n)"
    read -r SETUP_SES

    if [ "$SETUP_SES" = "y" ] || [ "$SETUP_SES" = "Y" ]; then
        echo "Enter AWS_ACCESS_KEY_ID:"
        read -r AWS_KEY
        echo "Enter AWS_SECRET_ACCESS_KEY:"
        read -r AWS_SECRET
        echo "Enter AWS_REGION (default: eu-west-2):"
        read -r AWS_REGION
        AWS_REGION=${AWS_REGION:-eu-west-2}
        echo "Enter SES_FROM_EMAIL:"
        read -r SES_FROM

        cat > "$APP_DIR/.env" <<EOF
AWS_ACCESS_KEY_ID=$AWS_KEY
AWS_SECRET_ACCESS_KEY=$AWS_SECRET
AWS_REGION=$AWS_REGION
SES_FROM_EMAIL=$SES_FROM
NODE_ENV=production
PORT=3000
EOF
        echo ".env file created with SES configuration."
    else
        cat > "$APP_DIR/.env" <<EOF
NODE_ENV=production
PORT=3000
EOF
        echo ".env file created (no email configured)."
    fi
else
    echo ".env file already exists, skipping."
fi

# -------------------------------------------
# 6. Setup PM2 and Nginx
# -------------------------------------------
echo ""
echo "[7/7] Starting app with PM2..."

cd "$APP_DIR"
pm2 delete headcount-app 2>/dev/null || true
pm2 start npm --name "headcount-app" -- start
pm2 save

# Configure PM2 to start on boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u "$(whoami)" --hp "/home/$(whoami)"
pm2 save

# Setup Nginx
echo "Configuring Nginx reverse proxy..."
sudo cp "$APP_DIR/scripts/nginx.conf" /etc/nginx/conf.d/headcount-app.conf

# Remove default nginx config if it conflicts
if [ "$OS" = "amzn" ]; then
    sudo sed -i 's/listen       80;/listen       8080;/' /etc/nginx/nginx.conf 2>/dev/null || true
elif [ "$OS" = "ubuntu" ]; then
    sudo rm -f /etc/nginx/sites-enabled/default
fi

sudo nginx -t && sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "========================================="
echo "  Setup complete!"
echo "========================================="
echo ""
echo "App is running at http://localhost:3000"
echo "Nginx proxies port 80 -> 3000"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs            - View app logs"
echo "  pm2 restart all     - Restart the app"
echo ""
echo "Visit http://<your-ec2-public-ip> in your browser."
