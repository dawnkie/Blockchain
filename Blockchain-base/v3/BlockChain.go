package v3

import "fmt"

// BlockChain 4- 函数：创建区块链
func BlockChain() {
	_, isExit := GetTailHeight()
	if !isExit {
		_, err := DB.Exec("alter table blocks  auto_increment = 1") // 重置表自增
		InsertBlock(NewBlock([]byte{}, "Block 0(创世块)"))
		_, err = DB.Exec("update blocks set height = 0 where height = 1") // 创世块高度→0
		_, err = DB.Exec("alter table blocks  auto_increment = 1")        // 重置表自增
		HandleError(err,"BlockChain")
	}
}

// AddBlock 5- 函数：添加区块
func AddBlock(data string) {
	height, isExit := GetTailHeight()
	if isExit {
		tailBlock := QueryByHeight(height)
		if tailBlock == nil {
			fmt.Println("[ERROR]  - 区块链还未创建 !", ": ", "AddBlock")
			return
		}
		b := NewBlock(tailBlock.Hash, data)
		InsertBlock(b)
	}
}

// IsValid 5.1 函数：区块哈希验证
//func (bc *blockChain) IsValid(b *Block) bool {
//	hashInt := big.NewInt(1).SetBytes(b.getHash()[:])
//	target := big.NewInt(1)
//	target.Lsh(target, uint(256-targetBits))
//	return hashInt.Cmp(target) == -1
//}

//func (bc *blockChain) String() (str string) {
//	for i := range bc.Blocks {
//		str += "\r\n" + bc.Blocks[i].String() + "\r\n" + string(bytes.Repeat([]byte("\t"), 25)) + "↗"
//	}
//	return str
//}
