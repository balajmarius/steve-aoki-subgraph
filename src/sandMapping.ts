import { Transfer } from "../generated/Sand/Sand";
import { SandTransaction } from "../generated/schema";

export function handleTransfer(event: Transfer): void {
  let sender = event.params.from.toHex();
  let receiver = event.params.to.toHex();

  let transactionHash = event.transaction.hash.toHex();
  let amount = event.params.value;
  let timestamp = event.block.timestamp;

  let sandTransaction = SandTransaction.load(transactionHash);
  if (sandTransaction == null) {
    sandTransaction = new SandTransaction(transactionHash);
    sandTransaction.from = sender;
    sandTransaction.to = receiver;
    sandTransaction.amount = amount;
    sandTransaction.timestamp = timestamp;
    sandTransaction.save();
  }
}
