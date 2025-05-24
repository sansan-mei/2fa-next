import { generateSnowflake } from "@/utils/totp";
import { DataConnection, Peer } from "peerjs";
import { useEffect, useMemo, useState } from "react";

export type Data = string | number | object | boolean;

export function useWebRtcConnection() {
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [peerId, setPeerId] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [data, setData] = useState<Data[]>([]);
  const [isInitiator, setIsInitiator] = useState<boolean | null>(null);

  const isConnected = useMemo(() => {
    return !!connection?.open;
  }, [connection]);

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
        reject(err);
      });

      conn.on("close", () => {
        addLog("连接已关闭");
        setConnection(null);
        resolve(null);
      });
    });
  };

  const connectToPeer = async (targetId: string) => {
    if (!targetId || !peer) return;
    const conn = peer.connect(targetId.replace(/-/g, ""));
    setIsInitiator(true);
    addLog(`尝试连接到 ${targetId}`);
    return await setupConnectionEvents(conn);
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
      return false;
    }
  };

  const startCreatePeer = (): Promise<Peer> => {
    return new Promise((resolve, reject) => {
      if (!peerId) return reject(new Error("peerId is not set"));
      if (peer) return resolve(peer);
      const _peer = new Peer(peerId);

      _peer.on("open", (id) => {
        addLog(`已连接到服务器，我的ID是: ${id}`);
        setPeer(_peer);
        resolve(_peer);
      });

      _peer.on("error", (err) => {
        addLog(`Peer错误: ${err.message}`);
        reject(err);
      });

      _peer.on("connection", (conn) => {
        setIsInitiator(false);
        addLog(`收到来自 ${conn.peer} 的连接`);
        setupConnectionEvents(conn);
      });
    });
  };

  const reset = () => {
    setPeerId("");
    addLog("清理连接");
    peer?.destroy?.();
    connection?.close?.();
    setConnection(null);
    return Promise.resolve(true);
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
  };
}
