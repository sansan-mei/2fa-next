import { generateSnowflake } from "@/utils/totp";
import { DataConnection, Peer, PeerError } from "peerjs";
import { useEffect, useMemo, useState } from "react";

export type Data = string | number | object | boolean;

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error"
  | "disconnected";

type PeerErrorType =
  | "not-open-yet"
  | "message-too-big"
  | "negotiation-failed"
  | "connection-closed"
  | "disconnected"
  | "browser-incompatible"
  | "invalid-id"
  | "invalid-key"
  | "network"
  | "peer-unavailable"
  | "ssl-unavailable"
  | "server-error"
  | "socket-error"
  | "socket-closed"
  | "unavailable-id"
  | "webrtc";

export function useWebRtcConnection() {
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [peerId, setPeerId] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [data, setData] = useState<Data[]>([]);
  const [isInitiator, setIsInitiator] = useState<boolean | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<Error | PeerError<PeerErrorType> | null>(
    null
  );
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const isConnected = useMemo(() => {
    return status === "connected" && !!connection?.open;
  }, [connection, status]);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  // 统一处理连接事件的函数
  const setupConnectionEvents = (
    conn: DataConnection
  ): Promise<DataConnection | null> => {
    return new Promise((resolve, reject) => {
      conn.on("open", () => {
        addLog("连接已建立");
        setConnection(conn);
        setStatus("connected");
        setError(null);
        resolve(conn);
      });

      conn.on("data", (data) => {
        if (data) {
          addLog(`收到数据: ${data}`);
          setData((prev) => [...prev, data as Data]);
        }
      });

      conn.on("error", (err) => {
        addLog(`连接错误: ${err}`);
        setConnection(null);
        setStatus("error");
        setError(err);
        reject(err);
      });

      conn.on("close", () => {
        addLog("连接已关闭");
        setConnection(null);
        setStatus("disconnected");
        resolve(null);
      });
    });
  };

  const connectToPeer = async (targetId: string) => {
    if (!targetId || !peer) {
      const err = new Error("无效的 peer ID 或 peer 未初始化");
      addLog("连接失败: " + err.message);
      setStatus("error");
      setError(err);
      return null;
    }

    try {
      setStatus("connecting");
      const conn = peer.connect(targetId.replace(/-/g, ""));
      setIsInitiator(true);
      addLog(`尝试连接到 ${targetId}`);
      return await setupConnectionEvents(conn);
    } catch (err) {
      addLog(`连接失败: ${err}`);
      setStatus("error");
      setError(err as Error);
      return null;
    }
  };

  const sendData = (data: Data) => {
    if (!connection) {
      addLog("发送失败: 没有活跃连接");
      return false;
    }

    if (!connection.open) {
      addLog("发送失败: 连接未打开");
      return false;
    }

    try {
      connection.send(data);
      addLog(`发送数据: ${data}`);
      return true;
    } catch (error) {
      addLog(`发送数据失败: ${error}`);
      setError(error as Error);
      return false;
    }
  };

  const startCreatePeer = (): Promise<Peer> => {
    return new Promise((resolve, reject) => {
      if (!peerId) {
        const err = new Error("peerId is not set");
        addLog("创建 peer 失败: " + err.message);
        setError(err);
        setStatus("error");
        reject(err);
        return;
      }

      if (peer) {
        resolve(peer);
        return;
      }

      try {
        const _peer = new Peer(peerId);

        _peer.on("open", (id) => {
          addLog(`已连接到服务器，我的ID是: ${id}`);
          setPeer(_peer);
          setStatus("idle");
          resolve(_peer);
        });

        _peer.on("error", (err) => {
          addLog(`Peer错误: ${err.message}`);
          setStatus("error");
          setError(err);
          reject(err);
        });

        _peer.on("connection", (conn) => {
          setIsInitiator(false);
          addLog(`收到来自 ${conn.peer} 的连接`);
          setupConnectionEvents(conn);
        });
      } catch (err) {
        addLog(`创建 peer 失败: ${err}`);
        setStatus("error");
        setError(err as Error);
        reject(err);
      }
    });
  };

  const reset = () => {
    addLog("清理连接");
    peer?.destroy?.();
    connection?.close?.();
    setPeer(null);
    setConnection(null);
    setStatus("idle");
    setError(null);
    setRetryCount(0);
    return Promise.resolve(true);
  };

  const retry = async () => {
    if (retryCount >= MAX_RETRIES) {
      addLog("达到最大重试次数");
      return false;
    }

    setRetryCount((prev) => prev + 1);
    addLog(`尝试重连 (${retryCount + 1}/${MAX_RETRIES})`);

    try {
      await reset();
      await startCreatePeer();
      return true;
    } catch (err) {
      addLog(`重连失败: ${err}`);
      setError(err as Error);
      return false;
    }
  };

  useEffect(() => {
    const id = generateSnowflake();
    setPeerId(id);
    return () => {
      reset();
    };
  }, []);

  return {
    connection,
    peerId,
    logs,
    peer,
    connectToPeer,
    sendData,
    isConnected,
    data,
    startCreatePeer,
    isInitiator,
    reset,
    status,
    error,
    retry,
  };
}
