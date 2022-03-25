import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Test2 } from "../target/types/test2";
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AccountLayout as TokenAccountLayout,
  AccountInfo as TokenAccountInfo,
  u64,
} from "@solana/spl-token";

import {
  Connection,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from "@solana/web3.js";

describe("test2", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Test2 as Program<Test2>;

  let programId = program.programId;

  it("Is initialized!", async () => {
    let [mint, _mintNonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("mint"))],
      programId
    );

    let [test, _testNonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("test"))],
      programId
    );

    let [token, _tokenNonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("token"))],
      programId
    );

    // Add your test here.
    const tx = await program.rpc.initialize(_testNonce, {
      accounts: {
        mint,
        test,
        tokenAccount: token,
        admin: program.provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
      },
    });

    let info = await getTokenAccountInfo(program.provider.connection, token);
    console.log(info.amount.toNumber());

    console.log("Your transaction signature", tx);
  });
});

export async function getTokenAccountInfo(
  connection: Connection,
  key: PublicKey
): Promise<any> {
  let info = await connection.getAccountInfo(key);
  if (info === null) {
    throw Error(`Token account ${key.toString()} doesn't exist.`);
  }
  if (info.data.length != TokenAccountLayout.span) {
    throw new Error(`Invalid account size`);
  }

  const data = Buffer.from(info.data);
  const accountInfo = TokenAccountLayout.decode(data);
  accountInfo.address = key;
  accountInfo.mint = new PublicKey(accountInfo.mint);
  accountInfo.owner = new PublicKey(accountInfo.owner);
  accountInfo.amount = u64.fromBuffer(accountInfo.amount);

  if (accountInfo.delegateOption === 0) {
    accountInfo.delegate = null;
    accountInfo.delegatedAmount = new u64(0);
  } else {
    accountInfo.delegate = new PublicKey(accountInfo.delegate);
    accountInfo.delegatedAmount = u64.fromBuffer(accountInfo.delegatedAmount);
  }

  accountInfo.isInitialized = accountInfo.state !== 0;
  accountInfo.isFrozen = accountInfo.state === 2;

  if (accountInfo.isNativeOption === 1) {
    accountInfo.rentExemptReserve = u64.fromBuffer(accountInfo.isNative);
    accountInfo.isNative = true;
  } else {
    accountInfo.rentExemptReserve = null;
    accountInfo.isNative = false;
  }

  if (accountInfo.closeAuthorityOption === 0) {
    accountInfo.closeAuthority = null;
  } else {
    accountInfo.closeAuthority = new PublicKey(accountInfo.closeAuthority);
  }

  return accountInfo;
}
