import { BigInt, log } from "@graphprotocol/graph-ts";
import { Transfer } from "../generated/SteveAoki/SteveAoki";

import {
  AllTokenTransfer,
  TokenTransfer,
  PrimarySell,
  SecondarySell,
  User,
  Token,
  SandTransaction,
} from "../generated/schema";

let ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

let ONE = BigInt.fromI32(1);
let ZERO = BigInt.fromI32(0);

const setUser = (
  userId: string,
  timestamp: BigInt,
  price: BigInt,
  ethPrice: BigInt,
  buy: bool
): User => {
  let user = User.load(userId);
  if (user == null) {
    user = new User(userId);
    user.nbBuy = ZERO;
    user.buyVolumeInSand = ZERO;
    user.buyVolumeInEth = ZERO;
    user.nbSell = ZERO;
    user.sellVolumeInSand = ZERO;
    user.sellVolumeInEth = ZERO;
    user.timestamp = ZERO;
  }
  if (buy) {
    user.nbBuy = user.nbBuy.plus(ONE);
    user.buyVolumeInSand = user.buyVolumeInSand.plus(price);
    user.buyVolumeInEth = user.buyVolumeInEth.plus(ethPrice);
  } else {
    user.nbSell = user.nbSell.plus(ONE);
    user.sellVolumeInSand = user.sellVolumeInSand.plus(price);
    user.sellVolumeInEth = user.sellVolumeInEth.plus(ethPrice);
  }

  if (user.timestamp.lt(timestamp)) {
    user.timestamp = timestamp;
  }
  user.save();
  return user;
};

export function handleTransfer(event: Transfer): void {
  let sender = event.params.from.toHex();
  let receiver = event.params.to.toHex();
  let tokenId = event.params.tokenId;

  let transactionHash = event.transaction.hash.toHex();
  let ethPrice = event.transaction.value;
  let timestamp = event.block.timestamp;

  let price = ZERO;
  let sandTransaction = SandTransaction.load(transactionHash);
  if (sandTransaction != null) {
    price = sandTransaction.amount;
  }

  let senderUser = setUser(sender, timestamp, price, ethPrice, false);
  let receiverUser = setUser(receiver, timestamp, price, ethPrice, true);

  let token = Token.load(tokenId.toString());
  if (token == null) {
    token = new Token(tokenId.toString());
    token.nbBuy = ZERO;
    token.nbSell = ZERO;
    token.volumeInSand = ZERO;
    token.volumeInEth = ZERO;
    token.priceInSand = ZERO;
    token.priceInEth = ZERO;
    token.minPriceInSand = ZERO;
    token.minPriceInEth = ZERO;
    token.maxPriceInSand = ZERO;
    token.maxPriceInEth = ZERO;
    token.timestamp = ZERO;
    token.owner = ADDRESS_ZERO;
  }
  if (sender !== ADDRESS_ZERO) {
    token.nbSell = token.nbSell.plus(ONE);
  }
  token.nbBuy = token.nbBuy.plus(ONE);
  if (token.timestamp.lt(timestamp)) {
    token.timestamp = timestamp;
  }
  // Sand
  token.volumeInSand = token.volumeInSand.plus(price);
  token.priceInSand = price;
  if (price.lt(token.minPriceInSand)) {
    token.minPriceInSand = price;
  }
  if (price.gt(token.maxPriceInSand)) {
    token.maxPriceInSand = price;
  }
  // Eth
  token.volumeInEth = token.volumeInEth.plus(ethPrice);
  token.priceInEth = ethPrice;
  if (ethPrice.lt(token.minPriceInEth)) {
    token.minPriceInEth = ethPrice;
  }
  if (ethPrice.gt(token.maxPriceInEth)) {
    token.maxPriceInEth = ethPrice;
  }

  token.owner = receiver;
  token.save();

  let tokenTransfer = TokenTransfer.load(transactionHash);
  if (tokenTransfer == null) {
    tokenTransfer = new TokenTransfer(transactionHash);
    tokenTransfer.priceInSand = ZERO;
    tokenTransfer.priceInEth = ZERO;
    tokenTransfer.tokens = [];
  }
  log.info(`TokenTransfer ${tokenTransfer.tokens}`, []);

  tokenTransfer.from = senderUser.id;
  tokenTransfer.to = receiverUser.id;
  tokenTransfer.token = token.id;
  tokenTransfer.tokens.push(token.id);
  let tokens = tokenTransfer.tokens;
  tokens.push(token.id);
  tokenTransfer.tokens = tokens;
  tokenTransfer.timestamp = timestamp;
  tokenTransfer.priceInSand = price;
  tokenTransfer.priceInEth = ethPrice;
  tokenTransfer.save();

  log.info(`TokenTransfer ${tokenTransfer.tokens}`, []);

  if (sender == ADDRESS_ZERO) {
    let primarySell = PrimarySell.load(transactionHash);
    if (primarySell == null) {
      primarySell = new PrimarySell(transactionHash);
      primarySell.priceInSand = ZERO;
      primarySell.priceInEth = ZERO;
      primarySell.tokens = [];
    }
    primarySell.from = senderUser.id;
    primarySell.to = receiverUser.id;
    primarySell.token = token.id;
    let primaryTokens = primarySell.tokens;
    primaryTokens.push(token.id);
    primarySell.tokens = primaryTokens;
    primarySell.timestamp = timestamp;
    primarySell.priceInSand = price;
    primarySell.priceInEth = ethPrice;
    primarySell.save();
  } else {
    let secondarySell = SecondarySell.load(transactionHash);
    if (secondarySell == null) {
      secondarySell = new SecondarySell(transactionHash);
      secondarySell.priceInSand = ZERO;
      secondarySell.priceInEth = ZERO;
      secondarySell.tokens = [];
    }
    secondarySell.from = senderUser.id;
    secondarySell.to = receiverUser.id;
    secondarySell.token = token.id;
    let secondaryTokens = secondarySell.tokens;
    secondaryTokens.push(token.id);
    secondarySell.tokens = secondaryTokens;
    secondarySell.timestamp = timestamp;
    secondarySell.priceInSand = price;
    secondarySell.priceInEth = ethPrice;
    secondarySell.save();
  }

  let all = AllTokenTransfer.load("all");

  // If it does not exist we create entity
  if (all == null) {
    all = new AllTokenTransfer("all");
    all.nbPrimarySell = ZERO;
    all.primarySellVolumeInSand = ZERO;
    all.primarySellVolumeInEth = ZERO;
    all.nbSecondarySell = ZERO;
    all.secondarySellVolumeInSand = ZERO;
    all.secondarySellVolumeInEth = ZERO;
    all.last = ZERO;
  }
  if (sender == ADDRESS_ZERO) {
    all.nbPrimarySell = all.nbPrimarySell.plus(ONE);
    // Some sell can have multiple token.
    // sand amount is for all and should be counted once.
    if (tokenTransfer.tokens.length == 1) {
      all.primarySellVolumeInSand = all.primarySellVolumeInSand.plus(price);
      all.primarySellVolumeInEth = all.primarySellVolumeInEth.plus(ethPrice);
    }
  } else {
    all.nbSecondarySell = all.nbSecondarySell.plus(ONE);
    // Some sell can have multiple token.
    // sand amount is for all and should be counted once.
    if (tokenTransfer.tokens.length == 1) {
      all.secondarySellVolumeInSand = all.secondarySellVolumeInSand.plus(price);
      all.secondarySellVolumeInEth =
        all.secondarySellVolumeInEth.plus(ethPrice);
    }
  }

  if (all.last.lt(timestamp)) {
    all.last = timestamp;
  }
  all.save();
}
