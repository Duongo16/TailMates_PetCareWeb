import "@testing-library/jest-dom";
import React from "react";

// Mock Next.js router
jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
    }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image component
jest.mock("next/image", () => ({
    __esModule: true,
    default: function MockImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return React.createElement("img", props);
    },
}));

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(global, "localStorage", { value: localStorageMock });

// Mock fetch
global.fetch = jest.fn();

// Mock console.error to keep tests clean
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = (...args: unknown[]) => {
        // Filter out expected errors in tests
        if (
            typeof args[0] === "string" &&
            (args[0].includes("Warning:") || args[0].includes("Error:"))
        ) {
            return;
        }
        originalConsoleError(...args);
    };
});

afterAll(() => {
    console.error = originalConsoleError;
});

// Reset mocks between tests
beforeEach(() => {
    jest.clearAllMocks();
});
