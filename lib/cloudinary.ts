import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Delete an image from Cloudinary by its public_id
 * @param publicId The public_id of the image to delete
 * @returns true if deletion was successful, false otherwise
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
    // Skip if no public_id or if it's a placeholder/local image
    if (!publicId || publicId.startsWith("avatar_") || publicId.startsWith("pet_") || publicId.startsWith("product_") || publicId.startsWith("service_") || publicId.startsWith("banner")) {
        console.log(`[Cloudinary] Skipping delete for seed/placeholder: ${publicId}`);
        return false;
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === "ok") {
            console.log(`[Cloudinary] Successfully deleted: ${publicId}`);
            return true;
        } else {
            console.log(`[Cloudinary] Delete result for ${publicId}:`, result);
            return false;
        }
    } catch (error) {
        console.error(`[Cloudinary] Error deleting ${publicId}:`, error);
        return false;
    }
}

/**
 * Delete multiple images from Cloudinary
 * @param publicIds Array of public_ids to delete
 */
export async function deleteMultipleFromCloudinary(publicIds: string[]): Promise<void> {
    const validIds = publicIds.filter(id => id && !id.startsWith("avatar_") && !id.startsWith("pet_") && !id.startsWith("product_") && !id.startsWith("service_"));

    if (validIds.length === 0) return;

    try {
        const result = await cloudinary.api.delete_resources(validIds);
        console.log(`[Cloudinary] Bulk delete result:`, result);
    } catch (error) {
        console.error(`[Cloudinary] Error in bulk delete:`, error);
    }
}

export default cloudinary;
