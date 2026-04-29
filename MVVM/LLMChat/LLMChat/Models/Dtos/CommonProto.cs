using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LLMChat.Models.Dtos;

public class CommonProto
{
    // 用于解析 JSON 的原始数据对象
    public class FanControlProtocol
    {
        public string command { get; set; }
        public int percent { get; set; }
    }

}
