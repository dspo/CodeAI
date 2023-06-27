import React, { JSX, useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { fetch, getClient, Body, Response, ResponseType, Client } from "@tauri-apps/api/http";
import { Input } from "antd";
import { Card } from 'antd';
import { Col, Row } from 'antd';
import { Avatar, Divider, List, Skeleton } from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';
import "./App.css";
import "./bubble.css";
import { ReadOutlined } from "@ant-design/icons";
import react from "@vitejs/plugin-react";
import { type } from "os";

type Message = {
    from: string;
    content: string;
}

interface Completion {
    id: string
    object: string
    created: number
    model: string
    choices: Choice[]
}

type Choice = {
    index: number;
    finish_reason: string;
    message: Message;
}

function App() {
    const [greetMsg, setGreetMsg] = useState("");
    const [name, setName] = useState("");
    const [messages, setMessages] = useState([
        {
            from: "codeAI",
            content: "你好, 我是 Erda CodeAI, 你的结对编程伙伴, 问我一个问题吧 !"
        }
    ]);
    const [answer, setAnswer] = useState("");

    async function greet(question: string) {
        // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
        // setGreetMsg(await invoke("greet", {name}));
    }

    function sendMessage(text: string): void {
        console.log("sendMessage", text)
        messages.push({
            from: "me",
            content: text
        });
        setMessages(messages.map(function (item: Message): Message {
            return {
                from: item.from,
                content: item.content,
            };
        }));
        const curDate = new Date();
        const endDate = new Date("2023-07-10");
        if (curDate.getTime() > endDate.getTime()) {
            setAnswer("您使用的客户端版本已过期, 请更新客户端版本。该版本最后支持时间为 "+ endDate.toLocaleDateString());
            return;
        }
        console.log("messages:", messages);
        const azureCompletionURL: string = "<set it when build>";
        const client = getClient();
        fetch(azureCompletionURL, {
            method: "POST",
            timeout: 30,
            body: Body.json({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "Your name is CodeAI. You are trained by Erda. You are my Pairing Programming Partners."
                    }, {
                        role: "user",
                        content: text
                    }
                ],
                max_tokens: 2048,
                stream: false
            }),
            headers: {
                "Accept-Encoding": "gzip",
                "Cache-Control": "no-cache",
                "Accept": "text/event-stream",
                "Api-Key": "<set it when build>",
                "Content-Type": "application/json"
            },
            responseType: ResponseType.JSON,

        }).then((value) => {
            console.log("response.data:", value.data);
            const s = JSON.stringify(value.data);
            const j = JSON.parse(s);
            console.log("parsed data", j);

            const completion: Completion = JSON.parse(s);
            setAnswer(completion.choices[completion.choices.length-1].message.content);
            
        }).catch((reason: any) => {
            setAnswer(reason);
            console.log("request error:", reason);
        });
    }

    useEffect((): void => {
        messages.push({
            from: "codeAI",
            content: answer,
        });
        setMessages(messages.filter((item: Message): boolean => {
            return item.content != "\n" && item.content != "" && item.content != " "
        }).map((item: Message): Message => {
            return {
                from: item.from,
                content: item.content,
            };
        }));
    }, [answer]);

    return (
        <div className="container">
            <WelcomeComponent />
            <ChatBox messages={messages} />
            <InputBox sendMessage={sendMessage} />
        </div>
    );
}

function WelcomeComponent(): JSX.Element {
    return (
        <div>
            <h1>Welcome to Erda CodeAI!</h1>
            <div className="row">
                <a href="https://www.erda.cloud" target="_blank">
                    <img src="https://static.erda.cloud/images/erda-logo.svg" className="logo vite" alt="Vite logo" />
                </a>
            </div>
        </div>
    )
}

function ChatBox({ messages }: { messages: Message[] }): JSX.Element {
    console.log("ChatBox", messages)
    return (
        <div style={{ backgroundColor: 'white', color: 'black', textAlign: "left" }}>
            <div
                id="scrollableDiv"
                style={{
                    height: 500,
                    overflow: 'auto',
                    padding: '0 16px',
                    border: '1px solid rgba(140, 140, 140, 0.35)',
                    backgroundColor: 'white',
                    color: 'black',
                    textAlign: 'left'
                }}
            >
                <Row color="black">
                    <Col span={24}>
                        <MessageRows messages={messages} />
                        <div className="row"><p></p></div>
                    </Col>
                </Row>
            </div>
        </div>
    )
}

function MessageRows({ messages }: { messages: Message[] }): JSX.Element {
    const items: JSX.Element[] = messages.map(function (item: Message): JSX.Element {
        if (item.from == "me") {
            return (<MessageRowRight content={item.content} />);
        } else {
            return (<MessageRowLeft content={item.content} />);
        }
    })
    return (<div>{items}</div>)
}

function MessageRowRight({ content }: { content: string }): JSX.Element {
    return (
        <div>
            <div className="row"><p></p></div>
            <Row>
                <Col span={18} push={4}>
                    <Card>
                        <p>{content}</p>
                    </Card>
                </Col>
                <Col span={2} push={4}>
                    <p>- 我</p>
                </Col>
            </Row>
        </div>
    )
}

function MessageRowLeft({ content }: { content: string }): JSX.Element {
    return (
        <div>

            <div className="row"><p></p></div>
            <Row>
                <Col span={2}>
                    <p>CodeAI -</p>
                </Col>
                <Col span={18}>
                    <Card>
                        <p>{content}</p>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}

function InputBox({ sendMessage }: { sendMessage: (text: string) => void }): JSX.Element {
    const [text, setText] = useState("");
    const { TextArea } = Input;

    function onChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
        setText(e.target.value.toString());
    }

    function onPressEnter(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
        sendMessage(text);
        e.preventDefault();
        setText("");
    }

    return (
        <div>
            <div className="row"><p></p></div>
            <Row id="inputBox">
                <Col span={24}>
                    <TextArea
                        value={text}
                        showCount
                        maxLength={1000}
                        style={{ height: 140, resize: "none" }}
                        onChange={onChange}
                        placeholder="我是 Erda CodeAI, 你的 AI 助手, 说出你的问题吧"
                        size="middle"
                        rows={6}
                        autoSize={false}
                        onPressEnter={onPressEnter}
                    />
                </Col>
            </Row>
        </div>
    )
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default App;
