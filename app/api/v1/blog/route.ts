import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import BlogPost, { BlogStatus } from "@/models/BlogPost";
import { authenticate, apiResponse } from "@/lib/auth";

// GET /api/v1/blog - List blog posts (Public)
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const category = searchParams.get("category");
        const search = searchParams.get("search");
        const sort = searchParams.get("sort") || "newest";

        const query: any = {
            status: BlogStatus.PUBLISHED,
        };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const skip = (page - 1) * limit;

        let sortOption: any = { published_at: -1 };
        if (sort === "oldest") {
            sortOption = { published_at: 1 };
        } else if (sort === "popular") {
            sortOption = { view_count: -1 };
        }

        const [posts, total] = await Promise.all([
            BlogPost.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .select("-content") // Exclude content for list view to reduce payload
                .lean(),
            BlogPost.countDocuments(query),
        ]);

        return apiResponse.success({
            posts,
            pagination: {
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get blogs error:", error);
        return apiResponse.serverError("Failed to fetch blog posts");
    }
}

// POST /api/v1/blog - Create a new blog post
export async function POST(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (error) return error;

        await connectDB();

        const body = await request.json();

        // Basic validation
        if (!body.title || !body.content || !body.category) {
            return apiResponse.error("Missing required fields");
        }

        const newPost = await BlogPost.create({
            ...body,
            author_id: user!._id,
            author_name: user!.full_name,
            author_avatar: user!.avatar,
            status: BlogStatus.PENDING, // Default to pending approval
        });

        return apiResponse.created(newPost, "Blog post created successfully");
    } catch (error) {
        console.error("Create blog error:", error);
        return apiResponse.serverError("Failed to create blog post");
    }
}
