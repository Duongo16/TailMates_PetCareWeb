import PusherServer from "pusher"
import PusherClient from "pusher-js"

// Server-side Pusher
const pusherConfig = {
    appId: process.env.PUSHER_APP_ID || "",
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
    secret: process.env.PUSHER_SECRET || "",
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",
    useTLS: true,
};

export const pusherServer = pusherConfig.appId
    ? new PusherServer(pusherConfig)
    : null as unknown as PusherServer;

// Client-side Pusher
export const pusherClient = pusherConfig.key
    ? new PusherClient(pusherConfig.key, {
        cluster: pusherConfig.cluster,
        userAuthentication: {
            endpoint: "/api/v1/pusher/auth",
            transport: "ajax",
        },
        channelAuthorization: {
            endpoint: "/api/v1/pusher/auth",
            transport: "ajax",
            headersProvider: () => {
                const token = typeof window !== "undefined" ? localStorage.getItem("tailmates_token") : null;
                return token ? { Authorization: `Bearer ${token}` } : {};
            }
        }
    })
    : null as unknown as PusherClient;
