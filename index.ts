import { Keypair } from "@solana/web3.js";
import { Telegraf, Markup } from "telegraf";
import { message } from "telegraf/filters";

const bot = new Telegraf("BOT KEY");
const USERS: Record<string, Keypair> = {};

interface pendingReqType {
  type: "SEND_SOL" | "SEND_TOKEN";
  amount?: number;
  to?: string;
}
const PENDING_REQUEST: Record<string, pendingReqType> = {};

const keyboard = Markup.inlineKeyboard([
  [Markup.button.callback("Generate Wallet", "generate_wallet")],
  [Markup.button.callback("Show pubkey", "show_pubkey")],
  [Markup.button.callback("Send SOL","send_sol")]
]);

const generateWalletButton = Markup.inlineKeyboard([
  Markup.button.callback("Generate Wallet", "generate_wallet"),
]);

bot.start(async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  let welcomeMessage = "Welcome To SOL bot";

  return ctx.reply(welcomeMessage, {
    parse_mode: "Markdown",
    ...keyboard,
  });
});

bot.action("generate_wallet", (ctx) => {
  ctx.answerCbQuery("Generating new Wallet...");
  const keypair = Keypair.generate();
  const userId = ctx.from?.id;
  USERS[userId] = keypair;

  ctx.sendMessage(
    `New wallet create with PubKey: ${keypair.publicKey.toBase58()}`,
    { parse_mode: "Markdown", ...keyboard }
  );
});

bot.action("show_pubkey", (ctx) => {
  ctx.answerCbQuery("Getting Your key");
  const userId = ctx.from?.id;
  const keypair = USERS[userId];

  if (!keypair) {
    ctx.sendMessage(
      "You dont have wallet, please click generate wallet button",
      {
        parse_mode: "Markdown",
        ...generateWalletButton,
      }
    );
    return;
  }

  ctx.sendMessage(`PubKey ${keypair?.publicKey.toBase58()}`);
});

bot.action("send_sol", (ctx) => {
  ctx.answerCbQuery();
  const userId = ctx.from?.id;

  ctx.sendMessage("Share address to send SOL");

  PENDING_REQUEST[userId] = {
    type: "SEND_SOL",
  };
});

bot.on(message("text"), (ctx) => {
  const userId = ctx.from?.id;

  if (PENDING_REQUEST[userId]?.type == "SEND_SOL") {
    if (PENDING_REQUEST[userId] && !PENDING_REQUEST[userId].to) {
      PENDING_REQUEST[userId].to = ctx.message.text;
      ctx.sendMessage("How much SOL you want to send");
    } else {
      const amount = ctx.message.text;

      ctx.sendMessage(
        `Initiated a txn for ${amount} SOL to ${PENDING_REQUEST[userId].to}`
      );
      delete PENDING_REQUEST[userId];
    }
  }
});

await bot.launch();
