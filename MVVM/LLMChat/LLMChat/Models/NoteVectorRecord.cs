using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.VectorData;

namespace LLMChat.Models;

public class NoteVectorRecord
{
    [VectorStoreKey]                                 
    public string Id { get; set; } = string.Empty;

    [VectorStoreData]        
    public string Text { get; set; } = string.Empty;

    [VectorStoreData]
    public string Title { get; set; } = string.Empty;

    [VectorStoreData]
    public string NoteId { get; set; } = string.Empty;

    [VectorStoreData]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [VectorStoreVector(768)]      
    public ReadOnlyMemory<float> Vector { get; set; }  
}