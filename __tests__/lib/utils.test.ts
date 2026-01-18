import { cn } from "@/lib/utils";

describe("cn utility function", () => {
    it("should merge class names correctly", () => {
        const result = cn("class1", "class2");
        expect(result).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
        const result = cn("base", true && "active", false && "disabled");
        expect(result).toContain("base");
        expect(result).toContain("active");
        expect(result).not.toContain("disabled");
    });

    it("should handle undefined and null values", () => {
        const result = cn("class1", undefined, null, "class2");
        expect(result).toBe("class1 class2");
    });

    it("should handle empty strings", () => {
        const result = cn("", "class1", "");
        expect(result).toBe("class1");
    });

    it("should merge Tailwind classes correctly (last wins)", () => {
        const result = cn("p-4", "p-2");
        expect(result).toBe("p-2");
    });

    it("should handle object syntax", () => {
        const result = cn({ "text-red-500": true, "text-blue-500": false });
        expect(result).toContain("text-red-500");
        expect(result).not.toContain("text-blue-500");
    });

    it("should handle array of classes", () => {
        const result = cn(["class1", "class2"]);
        expect(result).toContain("class1");
        expect(result).toContain("class2");
    });
});
