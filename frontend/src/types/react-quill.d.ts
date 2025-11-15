declare module 'react-quill' {
    import { Component } from 'react';

    export interface QuillOptions {
        modules?: any;
        formats?: string[];
        placeholder?: string;
        readOnly?: boolean;
        theme?: string;
        bounds?: HTMLElement | string;
        debug?: string | boolean;
        scrollingContainer?: HTMLElement | string;
        strict?: boolean;
    }

    export interface UnprivilegedEditor {
        getLength(): number;
        getText(index?: number, length?: number): string;
        getHTML(): string;
        getBounds(index: number, length?: number): any;
        getSelection(focus?: boolean): any;
        getContents(index?: number, length?: number): any;
    }

    export interface ComponentProps extends QuillOptions {
        value?: string;
        defaultValue?: string;
        onChange?: (
            content: string,
            delta: any,
            source: string,
            editor: UnprivilegedEditor
        ) => void;
        onChangeSelection?: (
            selection: any,
            source: string,
            editor: UnprivilegedEditor
        ) => void;
        onFocus?: (
            selection: any,
            source: string,
            editor: UnprivilegedEditor
        ) => void;
        onBlur?: (
            previousSelection: any,
            source: string,
            editor: UnprivilegedEditor
        ) => void;
        onKeyPress?: (event: any) => void;
        onKeyDown?: (event: any) => void;
        onKeyUp?: (event: any) => void;
        tabIndex?: number;
        className?: string;
        style?: React.CSSProperties;
        preserveWhitespace?: boolean;
    }

    export default class ReactQuill extends Component<ComponentProps> {
        focus(): void;
        blur(): void;
        getEditor(): any;
        getEditingArea(): HTMLElement;
    }

    export class Quill {
        static find(node: HTMLElement, bubble?: boolean): any;
        static import(path: string): any;
        static register(path: string | object, def?: any, suppressWarning?: boolean): void;
    }
}

declare module 'react-quill/dist/quill.snow.css';
