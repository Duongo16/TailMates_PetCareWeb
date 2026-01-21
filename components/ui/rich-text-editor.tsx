"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "Nhập nội dung...", className }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isUpdatingRef = useRef(false);

    // Update editor content when value prop changes
    useEffect(() => {
        if (editorRef.current && !isUpdatingRef.current) {
            if (editorRef.current.innerHTML !== value) {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            isUpdatingRef.current = true;
            onChange(editorRef.current.innerHTML);
            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 0);
        }
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    };

    const insertHeading = (level: number) => {
        execCommand("formatBlock", `h${level}`);
    };

    return (
        <div className={cn("border rounded-lg overflow-hidden", className)}>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
                {/* Headings */}
                <select
                    onChange={(e) => {
                        if (e.target.value) {
                            insertHeading(parseInt(e.target.value));
                            e.target.value = "";
                        }
                    }}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                >
                    <option value="">Tiêu đề</option>
                    <option value="1">H1</option>
                    <option value="2">H2</option>
                    <option value="3">H3</option>
                    <option value="4">H4</option>
                </select>

                {/* Basic Formatting */}
                <button
                    type="button"
                    onClick={() => execCommand("bold")}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                    title="Bold (Ctrl+B)"
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    onClick={() => execCommand("italic")}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                    title="Italic (Ctrl+I)"
                >
                    <em>I</em>
                </button>
                <button
                    type="button"
                    onClick={() => execCommand("underline")}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                    title="Underline (Ctrl+U)"
                >
                    <u>U</u>
                </button>
                <button
                    type="button"
                    onClick={() => execCommand("strikeThrough")}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                    title="Strikethrough"
                >
                    <s>S</s>
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Lists */}
                <button
                    type="button"
                    onClick={() => execCommand("insertUnorderedList")}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                    title="Bullet List"
                >
                    • List
                </button>
                <button
                    type="button"
                    onClick={() => execCommand("insertOrderedList")}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                    title="Numbered List"
                >
                    1. List
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Alignment */}
                <button
                    type="button"
                    onClick={() => execCommand("justifyLeft")}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                    title="Align Left"
                >
                    ←
                </button>
                <button
                    type="button"
                    onClick={() => execCommand("justifyCenter")}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                    title="Align Center"
                >
                    ↔
                </button>
                <button
                    type="button"
                    onClick={() => execCommand("justifyRight")}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                    title="Align Right"
                >
                    →
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Links */}
                <button
                    type="button"
                    onClick={() => {
                        const url = prompt("Nhập URL:");
                        if (url) execCommand("createLink", url);
                    }}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                    title="Insert Link"
                >
                    🔗
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Clear Formatting */}
                <button
                    type="button"
                    onClick={() => execCommand("removeFormat")}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                    title="Clear Formatting"
                >
                    ✕
                </button>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none"
                data-placeholder={placeholder}
                suppressContentEditableWarning
                style={{
                    whiteSpace: "pre-wrap",
                }}
            />

            <style jsx>{`
                [contenteditable][data-placeholder]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    cursor: text;
                }
            `}</style>
        </div>
    );
}
