import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Check for users
    const users = await db.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        accounts: true,
      },
    });

    // Check for accounts
    const accounts = await db.account.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        accountCount: u.accounts.length,
        accounts: u.accounts.map(a => ({
          providerId: a.providerId,
          providerAccountId: a.providerAccountId,
        })),
      })),
      accounts: accounts.map(a => ({
        id: a.id,
        provider: a.provider,
        providerId: a.providerId,
        providerAccountId: a.providerAccountId,
        userId: a.userId,
        userEmail: a.user.email,
      })),
      totalUsers: await db.user.count(),
      totalAccounts: await db.account.count(),
      googleAccounts: await db.account.count({ where: { providerId: 'google' } }),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

