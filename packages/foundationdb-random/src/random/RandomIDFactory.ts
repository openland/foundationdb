export class RandomIDFactory {
    private nodeId: string;
    private lastTime: number = -1;
    private seq: number = 0;

    constructor(nodeId: number) {
        let n = nodeId.toString(2);
        while (n.length < 10) {
            n = '0' + n;
        }
        this.nodeId = n;
    }

    next() {
        let time = Date.now() - 1288834974657;
        if (this.lastTime >= time) {
            if (this.seq >= 4095) {
                this.seq = 0;
                this.lastTime++;
                time = this.lastTime;
            } else {
                this.seq++;
                time = this.lastTime;
            }
        } else {
            this.lastTime = time;
            this.seq = 0;
        }
        let dt = time.toString(2);
        while (dt.length < 41) {
            dt = '0' + dt;
        }
        let seqd = this.seq.toString(2);
        while (seqd.length < 12) {
            seqd = '0' + seqd;
        }
        let res2 = '0' + dt + this.nodeId + seqd;
        let res = '';
        for (let i = 0; i < 16; i++) {
            res += parseInt((res2[i * 4] + res2[i * 4 + 1] + res2[i * 4 + 2] + res2[i * 4 + 3]), 2).toString(16);
        }
        return res;
    }
}