import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/variables';

import { Button as BaseButton } from './Button';

const isTouch = Boolean(
    'ontouchstart' in window ||
        (window as any).navigator.maxTouchPoints > 0 ||
        (window as any).navigator.msMaxTouchPoints > 0,
);

interface CodeProps {
    children: React.ReactNode;
    language?: string;
    isLight?: boolean;
    isDiff?: boolean;
    gutter?: Array<number | undefined>;
    gutterLength?: number;
    canCopy?: boolean;
    isEtc?: boolean;
}

interface CodeState {
    hlCode?: string;
    didCopy?: boolean;
}

const Button = styled(BaseButton)`
    opacity: ${isTouch ? '1' : '0'};
    position: absolute;
    top: 1rem;
    right: 1rem;
    transition: opacity 0.2s;
    :focus {
        opacity: 1;
    }
`;

const Container = styled.div`
    position: relative;
    &:hover ${Button} {
        opacity: 1;
    }
`;

const Base =
    styled.div <
    CodeProps >
    `
    font-size: .875rem;
    color: ${props => (props.language === undefined ? colors.white : 'inherit')};
    background-color: ${props =>
        props.isLight ? 'rgba(255,255,255,.15)' : props.language === undefined ? colors.black : '#F1F4F5'};
    white-space: ${props => (props.language === undefined ? 'nowrap' : '')};
    position: relative;

    ${props =>
        props.isDiff
            ? `
        background-color: #E9ECED;
        display: flex;
        padding-top: 1.5rem;
        padding-bottom: 1.5rem;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    `
            : ``}
`;

const StyledCodeDiff = styled(({ gutterLength, children, ...props }: any) => <code {...props}>{children}</code>)`
    ::before {
        content: '';
        width: calc(0.75rem + ${props => props.gutterLength}ch);
        background-color: #e2e5e6;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
    }

    [class^='line-'] {
        display: inline-block;
        width: 100%;
        position: relative;
        padding-right: 1.5rem;
        padding-left: calc(2.25rem + ${props => props.gutterLength}ch);

        ::before {
            content: attr(data-gutter);

            width: ${props => props.gutterLength};
            padding-left: 0.375rem;
            padding-right: 0.375rem;
            position: absolute;
            top: 50%;
            left: 0;
            transform: translateY(-50%);
            z-index: 1;
        }
    }

    .line-addition {
        background-color: rgba(0, 202, 105, 0.1);
    }
    .line-deletion {
        background-color: rgba(255, 0, 0, 0.07);
    }
`;

const StyledPre = styled.pre`
    margin: 0;
    ${(props: { isDiff: boolean }) =>
        !props.isDiff
            ? `
        padding: 1.5rem;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    `
            : ``};
`;

const StyledCopyInput = styled.textarea`
    opacity: 0;
    height: 0;
    position: absolute;
    top: 0;
    right: 0;
    z-index: -1;
`;

const CopyInput = StyledCopyInput as any;

class Code extends React.Component<CodeProps, CodeState> {
    public state: CodeState = {};
    private readonly _code = React.createRef<HTMLTextAreaElement>();
    public componentDidMount(): void {
        /*
        * _onMountAsync is only setting state, so no point in handling the promise
        */
        // tslint:disable-next-line:no-floating-promises
        this._onMountAsync();
    }

    public render(): React.ReactNode {
        const { language, isLight, isDiff, children, gutterLength, canCopy } = this.props;
        const { hlCode } = this.state;

        let CodeComponent = 'code';
        let codeProps = {};
        if (isDiff) {
            codeProps = { gutterLength };
            CodeComponent = StyledCodeDiff as any;
        }

        return (
            <Container>
                <Base language={language} isDiff={isDiff} isLight={isLight}>
                    <StyledPre isDiff={isDiff}>
                        <CodeComponent
                            {...codeProps}
                            dangerouslySetInnerHTML={hlCode ? { __html: this.state.hlCode } : null}
                        >
                            {hlCode === undefined ? children : null}
                        </CodeComponent>
                    </StyledPre>
                    {!('clipboard' in navigator) ? (
                        <CopyInput readOnly={true} aria-hidden="true" ref={this._code} value={children} />
                    ) : null}
                </Base>
                {navigator.userAgent !== 'ReactSnap' && canCopy ? (
                    <Button onClick={this._handleCopyAsync}>{this.state.didCopy ? 'Copied' : 'Copy'}</Button>
                ) : null}
            </Container>
        );
    }

    private async _onMountAsync(): Promise<void> {
        const { language, children, isDiff, gutter, isEtc } = this.props;

        const code = children as string;

        if (language !== undefined) {
            const { highlight } = await System.import(/* webpackChunkName: 'highlightjs' */ 'ts/highlight');

            this.setState({
                hlCode: highlight({ language, code, isDiff, gutter, isEtc }),
            });
        }
    }

    private readonly _handleCopyAsync = async () => {
        try {
            if ('clipboard' in navigator) {
                await (navigator as any).clipboard.writeText(this.props.children);
                this.setState({ didCopy: true });
            } else {
                const lastActive = document.activeElement as HTMLElement;
                this._code.current.focus();
                this._code.current.select();
                document.execCommand('copy');
                lastActive.focus();
                this.setState({ didCopy: true });
            }
        } catch (error) {
            this.setState({ didCopy: false });
        }
    };
}

export { Code };
