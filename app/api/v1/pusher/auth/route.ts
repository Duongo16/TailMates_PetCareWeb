import { NextRequest } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { authenticate, apiResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        // Pusher client sends auth request as application/x-www-form-urlencoded
        const formData = await request.formData();
        const socketId = formData.get("socket_id") as string;
        const channelName = formData.get("channel_name") as string;

        if (!socketId || !channelName) {
            return apiResponse.badRequest("Missing socket_id or channel_name");
        }

        const presenceData = {
            user_id: user!._id.toString(),
            user_info: {
                name: user!.full_name,
                image: user!.avatar?.url,
            },
        };

        const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
        return new Response(JSON.stringify(authResponse), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Pusher auth error:", err);
        return apiResponse.serverError("Internal server error");
    }
}
