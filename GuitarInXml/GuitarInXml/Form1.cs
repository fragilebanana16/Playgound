// [Title]
// 《XML to Obejct/ Object to XML》
// [Blog]
// https://www.codeproject.com/Articles/1163664/Convert-XML-to-Csharp-Object
// [Brief]
//                                ***XML与Object之间的转换***
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Xml.Serialization;
using System.IO;

namespace GuitarInXml
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
            Test();
        }

        public void Test()
        {
            Serializer ser = new Serializer();
            string path = string.Empty;
            string xmlInputData = string.Empty;
            string xmlOutputData = string.Empty;

            path = Directory.GetCurrentDirectory() + @"\TEST.xml"; // Put xml with exe file same level
            xmlInputData = File.ReadAllText(path, Encoding.UTF8);

            // TODO:check if empty

            Guitar guitar = ser.Deserialize<Guitar>(xmlInputData);

            this.label1.Text = guitar.Songs[0].TabStrings[0].StringLine;
            this.label2.Text = guitar.Songs[0].TabStrings[1].StringLine;
            this.label3.Text = guitar.Songs[0].TabStrings[2].StringLine;
            this.label4.Text = guitar.Songs[0].TabStrings[3].StringLine;
            this.label5.Text = guitar.Songs[0].TabStrings[4].StringLine;
            this.label6.Text = guitar.Songs[0].TabStrings[5].StringLine;

            xmlOutputData = ser.Serialize<Guitar>(guitar);
            File.WriteAllText(Directory.GetCurrentDirectory() + @"\Output.xml", xmlOutputData, Encoding.UTF8);

            this.songCard1.SongAuthor = guitar.Songs[0].Author;
            this.songCard1.SongName = guitar.Songs[0].SongName;
        }
    }

    /// <summary>
    /// Serialize
    /// </summary>
    public class Serializer
    {
        /// <summary>
        /// Deserialize
        /// </summary>
        /// <typeparam name="T">T</typeparam>
        /// <param name="input">content</param>
        /// <returns>T</returns>
        public T Deserialize<T>(string input) where T : class
        {
            XmlSerializer ser = new XmlSerializer(typeof(T));

            using (StringReader sr = new StringReader(input))
            {
                return (T)ser.Deserialize(sr);
            }
        }

        /// <summary>
        /// Serialize
        /// </summary>
        /// <typeparam name="T">T</typeparam>
        /// <param name="ObjectToSerialize">object</param>
        /// <returns></returns>
        public string Serialize<T>(T ObjectToSerialize)
        {
            XmlSerializer xmlSerializer = new XmlSerializer(ObjectToSerialize.GetType());

            using (StringWriter textWriter = new StringWriter())
            {
                xmlSerializer.Serialize(textWriter, ObjectToSerialize);
                return textWriter.ToString();
            }
        }
    }

    /// <summary>
    /// Type
    /// </summary>
    public class Guitar
    {
        public List<Song> Songs { get; set; }
    }

    /// <summary>
    /// Single song
    /// </summary>
    public class Song
    {
        /// <summary>
        /// Author
        /// </summary>
        public string Author { get; set; }

        /// <summary>
        /// Song`s Name
        /// </summary>
        public string SongName { get; set; }

        /// <summary>
        /// Capo on fret
        /// </summary>
        public string Capo { get; set; }

        /// <summary>
        /// Progression used
        /// </summary>
        public string Chords { get; set; }

        /// <summary>
        /// Six strings
        /// </summary>
        public List<TabString> TabStrings { get; set; }

        /// <summary>
        /// Addition Description
        /// </summary>
        public string Tips { get; set; }

        /// <summary>
        /// RecordDate
        /// </summary>
        public DateTime RecordDate { get; set; }
    }

    /// <summary>
    /// Single string
    /// </summary>
    public class TabString
    {
        /// <summary>
        /// 1-6 string
        /// </summary>
        public string StringLine { get; set; }
    }
}
