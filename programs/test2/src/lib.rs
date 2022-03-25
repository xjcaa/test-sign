use anchor_lang::prelude::*;

use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub const TEST_SEED: &[u8] = b"test";

#[program]
pub mod test2 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> Result<()> {
        let seeds = mint_authority! {
            bump = bump
        };

        token::mint_to(
            ctx.accounts
                .into_mint_to_context()
                .with_signer(&[&seeds[..]]),
            1,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        mint::decimals = 0,
        mint::authority = test,
        seeds = [b"mint".as_ref()],
        bump,
        payer = admin,
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        seeds = [TEST_SEED],
        bump,
        payer = admin,
    )]
    pub test: Account<'info, Test>,
    #[account(
        init,
        token::mint = mint,
        token::authority = test,
        seeds = [b"token".as_ref()],
        bump,
        payer = admin,
    )]
    pub token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[macro_export]
macro_rules! mint_authority {
    (bump = $bump:expr) => {
        &[TEST_SEED, &[$bump]]
    };
}

#[account]
#[derive(Default)]
pub struct Test {
    pub number: u64,
}

impl<'info> Initialize<'info> {
    pub fn into_mint_to_context(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.mint.to_account_info(),
            to: self.token_account.to_account_info(),
            authority: self.test.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}
