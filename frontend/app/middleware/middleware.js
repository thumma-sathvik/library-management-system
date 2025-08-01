import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function middleware(req) {
  const { pathname } = req.nextUrl;
  
  // Updated public paths to match your routes
  const publicPaths = ['/Userlogin', '/Usersignup', '/Adminlogin', '/adminsignup'];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get('jwt');
  
  if (!cookie?.value) {
    console.log('No JWT cookie found, redirecting to login');
    return NextResponse.redirect(new URL('/Userlogin', req.url));
  }

  

  try {
    await jwtVerify(cookie.value, secret);
    return NextResponse.next();
  } catch (error) {
    console.log('Invalid JWT token, redirecting to login');
    return NextResponse.redirect(new URL('/Userlogin', req.url));
  }
}

export const config = {
  matcher: [
    '/((?!api|_next|static|login|signup|Userlogin|Usersignup).*)',
  ],
};