package v4

type Transaction struct {
	// 交易序列
	TXID uint64
	// 区块链版本
	Version uint64
	// 时间戳
	Timestamp uint64
	// []input
	inputs []input
	// []output
	outputs []output
}

// 账户中的余额由账户中未消费的[]input的统计而来，即UTXO
type input struct {
	// 交易序列
	TXID uint64
	// 索引
	Index uint64
	// 解密脚本scriptSig：signature（付款人的私钥签名） + pub key（付款人公钥）
	scriptSig string

}

// 椭圆非对称加密 → `ScriptPubKey` → input的`scriptSig`解密 → 验证成功
type output struct {
	// 索引
	Index uint64
	// 交易数量
	Value uint64
	// 椭圆非对称加密脚本ScriptPubKey：signature（私钥签名） + pub key（公钥）+ P2PKH(Pay to Public Key hash) + address(对方收款地址)
	ScriptPubKey string
}