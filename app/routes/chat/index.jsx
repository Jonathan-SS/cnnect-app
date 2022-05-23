import {
  Form,
  useActionData,
  useLoaderData,
  useTransition,
} from "@remix-run/react";
import { useEffect, useState, useRef } from "react";
import { getSession, requireSession } from "../../sessions.server";
import useJs from "../../hooks/useJs";
import connectDb from "~/db/connectDb.server";
import { json } from "@remix-run/node";

export async function loader({ request, params }) {
  await requireSession(request);
  const db = await connectDb();
  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);
  const userId = session.get("userId");
  const chats = await db.models.Chat.find({
    participants: {
      $elemMatch: { userId },
    },
  });
  return { userId, chats };
}

export async function action({ request }) {
  const db = await connectDb();
  const form = await request.formData();
  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);
  const userId = session.get("userId");
  const chatId = form.get("chatId");

  if (form.get("_action") === "sendMessage") {
    const message = form.get("message");
    console.log("besked: ", message);

    const sendMessage = await db.models.Chat.updateOne(
      { _id: chatId },
      {
        $push: {
          messages: {
            sender: userId,
            message,
          },
        },
      }
      // {
      //   _id: chatId,
      // },
      // {
      //   $push: {
      //     messages: {
      //       sender: userId,
      //       message,
      //     },
      //   },
      // }
    );
    console.log(sendMessage);
  }

  let chat = await db.models.Chat.findOne({
    _id: chatId,
  });

  if (!chatId) {
    const user = await db.models.User.findById(userId);
    const participant = await db.models.User.findById(form.get("participant"));

    chat = await db.models.Chat.create({
      participants: [
        {
          userId: user._id,
          name: `${user.firstname} ${user.lastname}`,
          image: user.image.name,
        },
        {
          userId: participant._id,
          name: `${participant.firstname} ${participant.lastname}`,
          image: participant.image.name,
        },
      ],
      messages: [
        {
          message: "New chat started",
        },
      ],
    });
  }

  const messages = chat.messages;

  console.log("chat:", chat);
  console.log("chatId", chatId);
  console.log("messages", messages);
  return { chat, chatId, messages: chat.messages };
}

export default function Chats() {
  let hasJs = useJs();
  let transition = useTransition();
  const actionData = useActionData();
  console.log(actionData?.chat);
  const { chats, userId } = useLoaderData();
  console.log(actionData?.messages);
  console.log("den her");

  const buttonText =
    transition.state === "submitting" &&
    transition.submission.formData.get("_action") === "sendMessage"
      ? "Sending..."
      : "Send";

  return (
    <div className="flex gap-4 h-screen -my-8 py-8">
      <div className="bg-white p-4 rounded-xl shadow-lg w-80 flex flex-col gap-2  scrollbar:hidden">
        <h1 className=" font-semibold text-2xl ">Chats</h1>
        <Form method="get">
          <input
            className=" p-2 rounded-full mr-2 border border-gray-200"
            type="search"
            name="name"
            placeholder="Search..."
            // defaultValue={allParams?.name}
          />
          {!hasJs && (
            <button
              type="submit"
              className="  bg-green-400 px-3 py-2 rounded-full hover:bg-green-300 shadow-lg hover:shadow-md mr-4"
            >
              Search
            </button>
          )}
        </Form>
        <div className="max-h-screen scrollbar:hidden max-w-40">
          {chats
            ? chats.map((chat) => (
                <Form
                  key={chat._id}
                  method="post"
                  className=" border-b py-2 w-full"
                >
                  <button
                    className="flex"
                    type="submit"
                    name="chatId"
                    value={chat._id}
                  >
                    <input
                      type="hidden"
                      name="participant"
                      value={chat.participants[1]._id}
                    />
                    <img
                      src="/403017_avatar_default_head_person_unknown_icon.png"
                      alt=""
                      className="w-12 h-12 rounded-full mr-2"
                    />
                    <div className=" text-left">
                      <h3 className=" text-xl font-semibold">
                        {chat.participants[1].name}
                      </h3>
                      <p className=" text-slate-400 text-xs max-w-1/2 truncate">
                        {chat.messages[chat.messages.length - 1].message.slice(
                          0,
                          25
                        ) + "..."}
                      </p>
                    </div>
                  </button>
                </Form>
              ))
            : null}
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-lg flex-1 flex flex-col justify-between ">
        <h2 className=" text-lg font-medium">Chat with name</h2>
        <div className=" ">
          <div className=" py-4 px-2 max-h-screen overflow-y-scroll  flex flex-col gap-4 justify-end">
            {actionData?.messages.length > 0 ? (
              actionData.messages.map((message) => (
                <div
                  key={message._id}
                  className={
                    "flex w-1/2" +
                    (userId === message.sender
                      ? " flex-row-reverse pl-4 self-end items-end "
                      : "  pr-4 items-end")
                  }
                >
                  <img
                    src={
                      actionData?.chat
                        ? `/uploads/${actionData.chat.participants[1].image}`
                        : "/403017_avatar_default_head_person_unknown_icon.png"
                    }
                    alt=""
                    className="w-12 h-12 rounded-full "
                  />
                  <div className=" flex-1 ">
                    <p
                      className={
                        "min-h-full p-2 rounded-lg" +
                        (userId === message.sender
                          ? " bg-green-400 mr-2 "
                          : "bg-slate-100 ml-2 ")
                      }
                    >
                      {message.message}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className=" -mb-2 w-1/2 px-2">
                <p className="min-h-full rounded-lg text-slate-400">
                  No message yet, be the first to reach out.
                </p>
              </div>
            )}
          </div>

          <Form method="post" className="flex items-end">
            <textarea
              className=" resize-none p-2 rounded-lg mr-2 border border-gray-200 flex-1"
              name="message"
              placeholder="Message..."
            />
            <input type="hidden" name="_action" value="sendMessage" />
            <input
              type="hidden"
              name="conversationId"
              value={
                actionData?.conversationId ? actionData?.conversationId : "NA"
              }
            />

            <button
              disabled={
                transition.state === "submitting" &&
                transition.submission.formData.get("_action") === "sendMessage"
              }
              type="submit"
              className="  bg-green-400 px-3 py-2 rounded-full hover:bg-green-300 shadow-lg hover:shadow-md mr-4"
            >
              {buttonText}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}

//TODO set up a chat with a user
//TODO add image to users
//TODO Add ability to delete messages
// TODO fix overflow of messages with no scroll

// TODO next, fix whole chat logic to new schema
// TODO fix this bug
