# Taraxa-fun server

Taraxa.fun is a fork of Pump.fun on [TARAXA](https://taraxa.io) network that enables users to deploy their own tokens with just a few clicks. This server handles token deployments, trades tracking, and real-time market data on the EventTracker smart contracts.

## Features

* Token deployment and management
* Real-time trade tracking via WebSocket
* Candlestick chart generation
* User authentication and profile management
* Comments and social interactions
* Real-time market data updates

## Technology Stack

* **Backend**: Express.js with TypeScript
* **Database**: MongoDB with Mongoose
* **Web3 Integration**: Viem
* **Real-time Communication**: WebSocket (ws)

## Prerequisites

* Node.js (v16 or higher)
* MongoDB
* Base Sepolia RPC URL
* Yarn or npm

## Installation

1. Clone the repository:
```bash
git clone https://github.com/taraxa-fun/taraxafun-server.git
cd taraxafun-server
```

2. Install dependencies:
```bash
yarn install
```

3. Create a `.env` file:
```env
PORT=
JWT_SECRET=
MONGODB_URI=
GOOGLE_CLOUD_CREDENTIALS=
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_BUCKET_NAME=
EVENT_TRACKER_ADDRESS=
POOL_ADDRESS=
DEPLOYER_ADDRESS=
```

4. Start the server:
```bash
yarn dev    # development mode
yarn build  # build project
yarn start  # production mode
```

## Project Structure
```
src/
├── config/        # Environment variables and configuration
│
├── controllers/   # Request handlers
│
├── middlewares/   # Express middlewares
│
├── models/        # MongoDB models
│
├── schemas/       # Validation schemas
│
├── routes/        # API routes
│
├── types/         # TypeScript type definitions
│
├── utils/         # Utility functions
│
├── ws/            # WebSocket handlers
│
└── server.ts      # Application entry point
```

## Main Features

### Token Deployment
* Easy token deployment through smart contracts
* Customizable token parameters
* Automatic verification and tracking

### Trade Tracking
* Real-time trade monitoring
* Price and volume tracking
* Historical trade data storage

### Real-time Market Data
* 1-minute candlestick generation (5-minutes coming soon)
* WebSocket subscriptions by token
* Live price updates

### WebSocket Endpoints

* `/ws/candle-1m`: Candlestick data updates
```json
// Subscribe to a token
{
  "type": "SUBSCRIBE_CANDLE",
  "token_address": "0x..."
}

// Unsubscribe
{
  "type": "UNSUBSCRIBE_CANDLE",
  "token_address": "0x..."
}
```

* `/ws/trade-call`: Listening new trades

* `/ws/comment-created`: Listening new comments

* `/ws/create-fun`: Listening new tokens

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

* Special Thanks to [Taraxa](https://taraxa.io) Foundation for the grant
* [moongose-express-ts](https://github.com/sunnysidelabs/mongoose-express-ts)