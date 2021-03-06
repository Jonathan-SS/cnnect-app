import { Form, useActionData } from "@remix-run/react";
import { useState } from "react";
import Logo from "../icons/Logo";
import connectDb from "~/db/connectDb.server";
import bcrypt from "bcryptjs";
import { json, redirect } from "@remix-run/node";
import { Link } from "react-router-dom";
import { commitSession, getSession } from "../sessions.server";
import Eye from "../icons/Eye";
import EyeClosed from "../icons/EyeClosed";

export async function action({ request }) {
  const db = await connectDb();
  const form = await request.formData();
  const password = form.get("Password");
  const email = form.get("email");

  try {
    const user = await db.models.User.findOne({ email: email });

    if (!user) {
      return json(
        {
          errors: {
            email: "No user with that email",
          },
        },
        { status: 400 }
      );
    }

    const dbPassword = user.password;
    if (!(await bcrypt.compare(password, dbPassword))) {
      return json(
        {
          errors: {
            password: "Wrong password, try again.",
          },
        },
        { status: 400 }
      );
    }

    const session = await getSession(request.headers.get("Cookie"));
    session.set("userId", user.id);

    return redirect("/profile", {
      headers: {
        status: 200,
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    return json(
      { errors: error.errors, values: Object.fromEntries(form) },
      { status: 400 }
    );
  }
}

export default function LogIn(params) {
  const actionData = useActionData();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col items-center relative">
      <Logo />
      <div className="text-center mt-4 flex flex-col gap-2 ">
        <h1 className=" text-4xl font-bold mb-4 ">Great to see you again!</h1>
      </div>
      <div className="relative">
        <Form method="post" className="flex flex-col gap-2 w-full md:w-96 ">
          {actionData?.errors?.email ? (
            <p className="text-red-500 px-2 ">{actionData?.errors.email}</p>
          ) : (
            <p className=" -mb-2 px-2 text-slate-400 ">Email</p>
          )}
          <input
            type="text"
            name="email"
            placeholder="Email"
            className={
              "w-full py-2 px-4 rounded-full border " +
              (actionData?.errors.email
                ? "border-red-500 -mt-2"
                : "  border-gray-300 ")
            }
          />
          {actionData?.errors?.password ? (
            <p className="text-red-500 px-2">{actionData?.errors.password}</p>
          ) : (
            <p className=" -mb-2 px-2 text-slate-400 ">Password</p>
          )}

          <input
            type={showPassword ? "text" : "password"}
            name="Password"
            placeholder="Password"
            id="password"
            className={
              "w-full py-2 px-4 rounded-full border " +
              (actionData?.errors.password
                ? "border-red-500 -mt-2"
                : "  border-gray-300 ")
            }
          />

          <button
            type="submit"
            className=" bg-green-400 px-3 py-2 rounded-full hover:bg-green-300 shadow-md hover:shadow-md mt-2"
          >
            Log In
          </button>
        </Form>
        <button
          onClick={() => {
            setShowPassword(!showPassword);
          }}
          className=" -mt-10 absolute bottom-16 right-0 flex max-w-fit pr-4"
        >
          {showPassword ? <EyeClosed /> : <Eye />}
        </button>
      </div>

      <Link
        className=" md:w-96 text-left px-2 mt-2 underline"
        to="/create-user"
      >
        Sign up!
      </Link>
    </div>
  );
}
//TODO: style alle Links
