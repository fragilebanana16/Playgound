using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace GuitarInXml.Controls
{
    public partial class SongCard : UserControl
    {
        public SongCard()
        {
            InitializeComponent();
        }

        public Image SongType
        {
            get
            {
                return this.ImgSongType.Image;
            }

            set
            {
                this.ImgSongType.Image = value;
            }
        }

        private DateTime songCreateDate = DateTime.Today;

        public DateTime SongCreateDate
        {
            get
            {
                return this.songCreateDate;
            }

            set
            {
                this.lblDate.Text = value.ToString();
            }
        }

        private string songAuthor = string.Empty;

        public string SongAuthor
        {
            get
            {
                return this.songAuthor;
            }

            set
            {
                if (null != value && this.songAuthor != value)
                {
                    this.lblSongAuthor.Text = value.ToString();
                }
            }
        }

        private string songName = string.Empty;

        public string SongName
        {
            get
            {
                return this.songName;
            }

            set
            {
                this.lblSongName.Text = value;
            }
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            
        }

        private bool liked = false;

        private void ImgLike_Click(object sender, EventArgs e)
        {
            this.liked = !this.liked;
            this.ImgLike.Image = this.liked ? Properties.Resources.Heart : Properties.Resources.Like;
        }

        private void mainTableLayout_Click(object sender, EventArgs e)
        {
            this.BackColor = Color.Red;
        }

        protected override void OnLostFocus(EventArgs e)
        {
            base.OnLostFocus(e);
            this.BackColor = Color.White;
        }

    }
}
