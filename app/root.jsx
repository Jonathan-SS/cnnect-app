import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLoaderData,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import connectDb from "~/db/connectDb.server.js";
import styles from "~/tailwind.css";
import MenuItem from "./components/MenuItem";

import BurgerMenu from "./icons/BurgerMenu";
import Candidates from "./icons/Candidates";
import Close from "./icons/Close";
import Home from "./icons/Home";
import LogIn from "./icons/LogIn";
import Logo from "./icons/Logo";
import Plus from "./icons/Plus";
import Posts from "./icons/Posts";
import Profile from "./icons/Profile";
import LogOut from "./icons/LogOut";
import Chat from "./icons/Chat";
import { getSession } from "./sessions.server";
import { Link } from "react-router-dom";
import Bug from "./illustrations/Bug";
import ChatIcon from "./components/chatIcon";

export const links = () => [
  {
    rel: "stylesheet",
    href: styles,
    as: "style",
  },
  {
    rel: "apple-touch-icon",
    href: "/apple-touch-icon.png",
    sizes: "180x180",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/favicon-32x32.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
    href: "/favicon-16x16.png",
  },
  {
    rel: "mask-icon",
    href: "/safari-pinned-tab.svg",
    color: "#5bbad5",
  },
  {
    rel: "manifest",
    href: "/site.webmanifest",
  },
];

export function meta() {
  return {
    charset: "utf-8",
    title: "Cnnect - ",
    viewport: "width=device-width,initial-scale=1",
    robots: "noindex,nofollow",
    "msapplication-TileColor": "content=#15803d",
    "theme-color": "content=#15803d",
  };
}

export async function loader({ request }) {
  const db = await connectDb();
  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);
  // TODO: find a way to do this
  const chatMessages = await db.models.Chat.find({
    $elemmatch: {
      participants: {
        $and: [{ userId: session.get("userId") }, { hasread: false }],
      },
    },
  });

  console.log(chatMessages.length);

  if (session.has("userId")) {
    return { loggedIn: true, messages: chatMessages };
  }

  return { loggedIn: false, messages: chatMessages };
}

export default function App() {
  const { loggedIn, messages } = useLoaderData();
  const [loggedin, setLoggedin] = useState(false);
  //TODO: add dark mode style
  useEffect(() => {
    //checks if the user prefers dark mode
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    }
    setLoggedin(loggedIn);
  }, [loggedIn]);

  return (
    <Layout messages={messages} loggedin={loggedin}>
      <Outlet />
    </Layout>
  );
}

export function Layout({ children, ...rest }) {
  const [navIsOpen, setNavIsOpen] = useState(false);
  const { loggedin, messages } = rest;
  function showMobileMenu() {
    const menu = document.getElementById("menu");
    menu.classList.toggle("hidden");
    menu.classList.toggle("flex");
    menu.classList.toggle("-translate-x-full");
    navIsOpen ? setNavIsOpen(false) : setNavIsOpen(true);
  }

  onscroll = (e) => {
    if (window.scrollY > 0) {
      document.getElementById("mobileHeader").classList.add("bg-white");
    } else {
      document.getElementById("mobileHeader").classList.remove("bg-white");
    }
  };

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="bg-slate-100 text-slate-800 font-sans md:flex">
        <aside
          id="menu"
          className=" z-40 fixed -translate-x-full hidden md:translate-x-0 md:flex flex-col h-100vh px-1 md:px-3 py-8 gap-6 "
        >
          <MenuItem
            icon={<Home />}
            onClick={showMobileMenu}
            label="Home"
            to="/"
          />
          <MenuItem
            icon={<Posts />}
            onClick={showMobileMenu}
            label="Job posts"
            to="/job-posts"
          />
          <MenuItem
            icon={<Candidates />}
            onClick={showMobileMenu}
            label="Candidates"
            to="/candidates"
          />
          {loggedin ? (
            <>
              <MenuItem
                icon={<Profile />}
                onClick={showMobileMenu}
                label="Profile"
                to="/profile"
              />
              <ChatIcon
                icon={<Chat />}
                onClick={showMobileMenu}
                label="Chat"
                to="/chat/chat-overview"
                messages={messages}
              />
            </>
          ) : null}

          {!loggedin ? (
            <MenuItem
              icon={<Plus />}
              onClick={showMobileMenu}
              label="Create User"
              to="/create-user"
            />
          ) : null}

          {loggedin ? (
            <MenuItem
              icon={<LogOut />}
              onClick={showMobileMenu}
              label="Logout"
              to="/logout"
            />
          ) : (
            <MenuItem
              icon={<LogIn />}
              onClick={showMobileMenu}
              label="Login"
              to="/login"
            />
          )}
        </aside>
        <div
          className="md:hidden top-0 fixed flex justify-center py-1  px-2 w-full rounded-lg "
          id="mobileHeader"
        >
          <div className=" absolute left-0 px-1 z-50">
            <button onClick={showMobileMenu}>
              {navIsOpen ? <Close /> : <BurgerMenu />}
            </button>
          </div>
          <Link to="/">
            <Logo className="h-auto w-20" />
          </Link>
        </div>

        <main className="flex-1 px-4 py-7 md:ml-14 z-20 md:mt-0 mt-4">
          {children}
        </main>

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  return (
    <Layout>
      <main className=" flex justify-center items-center col-span-5 flex-col ">
        <Bug />
        <h1 className=" text-5xl font-bold">{caught.statusText}</h1>
        <Link
          className="text-white flex items-center h-fit  bg-green-400 px-3 py-2 rounded-full hover:bg-green-300 shadow-md hover:shadow-md mt-4"
          to="/"
        >
          Go to the home page
        </Link>
      </main>
    </Layout>
  );
}

export function ErrorBoundary({ error }) {
  return (
    <Layout>
      <main className=" flex justify-center items-center col-span-5 flex-col ">
        <Bug />
        <h1 className="text-red-500 font-bold">
          {error.name}: {error.message}
        </h1>
        <Link
          className="text-white flex items-center h-fit  bg-green-400 px-3 py-2 rounded-full hover:bg-green-300 shadow-lg hover:shadow-md mt-4"
          to="/"
        >
          Go to the home page
        </Link>
      </main>
    </Layout>
  );
}
//TODOne add catch and ERROR boundry to everything
//TODOne add a 404 page
//TODOne make it work on mobile
// TODOne: find a way to check if the user is logged in for the Navbar
//TODO: add ability to report bugs maybe?
