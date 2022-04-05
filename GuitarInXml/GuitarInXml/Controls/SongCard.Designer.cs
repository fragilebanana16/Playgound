
namespace GuitarInXml.Controls
{
    partial class SongCard
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary> 
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Component Designer generated code

        /// <summary> 
        /// Required method for Designer support - do not modify 
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.mainTableLayout = new System.Windows.Forms.TableLayoutPanel();
            this.flowLayoutPanel1 = new System.Windows.Forms.FlowLayoutPanel();
            this.lblSongName = new System.Windows.Forms.Label();
            this.ImgSongType = new System.Windows.Forms.Label();
            this.ImgLike = new System.Windows.Forms.Label();
            this.flowLayoutPanel2 = new System.Windows.Forms.FlowLayoutPanel();
            this.lblSongAuthor = new System.Windows.Forms.Label();
            this.lblDate = new System.Windows.Forms.Label();
            this.mainTableLayout.SuspendLayout();
            this.flowLayoutPanel1.SuspendLayout();
            this.flowLayoutPanel2.SuspendLayout();
            this.SuspendLayout();
            // 
            // mainTableLayout
            // 
            this.mainTableLayout.ColumnCount = 2;
            this.mainTableLayout.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 61.6F));
            this.mainTableLayout.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 38.4F));
            this.mainTableLayout.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Absolute, 20F));
            this.mainTableLayout.Controls.Add(this.flowLayoutPanel1, 0, 0);
            this.mainTableLayout.Controls.Add(this.ImgLike, 1, 1);
            this.mainTableLayout.Controls.Add(this.flowLayoutPanel2, 0, 1);
            this.mainTableLayout.Controls.Add(this.lblDate, 1, 0);
            this.mainTableLayout.Dock = System.Windows.Forms.DockStyle.Fill;
            this.mainTableLayout.Location = new System.Drawing.Point(0, 0);
            this.mainTableLayout.Margin = new System.Windows.Forms.Padding(0);
            this.mainTableLayout.Name = "mainTableLayout";
            this.mainTableLayout.RowCount = 2;
            this.mainTableLayout.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 41.66667F));
            this.mainTableLayout.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 58.33333F));
            this.mainTableLayout.Size = new System.Drawing.Size(250, 54);
            this.mainTableLayout.TabIndex = 0;
            this.mainTableLayout.Click += new System.EventHandler(this.mainTableLayout_Click);
            // 
            // flowLayoutPanel1
            // 
            this.flowLayoutPanel1.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.flowLayoutPanel1.Controls.Add(this.lblSongName);
            this.flowLayoutPanel1.Controls.Add(this.ImgSongType);
            this.flowLayoutPanel1.Location = new System.Drawing.Point(1, 2);
            this.flowLayoutPanel1.Margin = new System.Windows.Forms.Padding(1);
            this.flowLayoutPanel1.Name = "flowLayoutPanel1";
            this.flowLayoutPanel1.Size = new System.Drawing.Size(151, 18);
            this.flowLayoutPanel1.TabIndex = 5;
            // 
            // lblSongName
            // 
            this.lblSongName.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.lblSongName.AutoSize = true;
            this.lblSongName.Font = new System.Drawing.Font("SimSun", 12F);
            this.lblSongName.Location = new System.Drawing.Point(3, 0);
            this.lblSongName.Name = "lblSongName";
            this.lblSongName.Size = new System.Drawing.Size(144, 16);
            this.lblSongName.TabIndex = 0;
            this.lblSongName.Text = "SongNameNoContent";
            // 
            // ImgSongType
            // 
            this.ImgSongType.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.ImgSongType.AutoSize = true;
            this.ImgSongType.Image = global::GuitarInXml.Properties.Resources.Electric_guitar;
            this.ImgSongType.Location = new System.Drawing.Point(3, 16);
            this.ImgSongType.MinimumSize = new System.Drawing.Size(16, 16);
            this.ImgSongType.Name = "ImgSongType";
            this.ImgSongType.Size = new System.Drawing.Size(16, 16);
            this.ImgSongType.TabIndex = 2;
            // 
            // ImgLike
            // 
            this.ImgLike.Anchor = System.Windows.Forms.AnchorStyles.Right;
            this.ImgLike.AutoSize = true;
            this.ImgLike.Image = global::GuitarInXml.Properties.Resources.Like;
            this.ImgLike.Location = new System.Drawing.Point(224, 30);
            this.ImgLike.Margin = new System.Windows.Forms.Padding(0, 0, 10, 0);
            this.ImgLike.MinimumSize = new System.Drawing.Size(16, 16);
            this.ImgLike.Name = "ImgLike";
            this.ImgLike.Size = new System.Drawing.Size(16, 16);
            this.ImgLike.TabIndex = 3;
            this.ImgLike.Click += new System.EventHandler(this.ImgLike_Click);
            // 
            // flowLayoutPanel2
            // 
            this.flowLayoutPanel2.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.flowLayoutPanel2.Controls.Add(this.lblSongAuthor);
            this.flowLayoutPanel2.Location = new System.Drawing.Point(1, 25);
            this.flowLayoutPanel2.Margin = new System.Windows.Forms.Padding(1);
            this.flowLayoutPanel2.Name = "flowLayoutPanel2";
            this.flowLayoutPanel2.Size = new System.Drawing.Size(151, 26);
            this.flowLayoutPanel2.TabIndex = 6;
            // 
            // lblSongAuthor
            // 
            this.lblSongAuthor.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.lblSongAuthor.AutoSize = true;
            this.lblSongAuthor.Location = new System.Drawing.Point(3, 8);
            this.lblSongAuthor.Margin = new System.Windows.Forms.Padding(3, 8, 3, 0);
            this.lblSongAuthor.Name = "lblSongAuthor";
            this.lblSongAuthor.Size = new System.Drawing.Size(95, 12);
            this.lblSongAuthor.TabIndex = 1;
            this.lblSongAuthor.Text = "AuthorNoContent";
            // 
            // lblDate
            // 
            this.lblDate.Anchor = System.Windows.Forms.AnchorStyles.Right;
            this.lblDate.AutoSize = true;
            this.lblDate.Location = new System.Drawing.Point(164, 7);
            this.lblDate.Margin = new System.Windows.Forms.Padding(3, 5, 3, 0);
            this.lblDate.Name = "lblDate";
            this.lblDate.Size = new System.Drawing.Size(83, 12);
            this.lblDate.TabIndex = 4;
            this.lblDate.Text = "DateNoContent";
            // 
            // SongCard
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.White;
            this.Controls.Add(this.mainTableLayout);
            this.Name = "SongCard";
            this.Size = new System.Drawing.Size(250, 54);
            this.mainTableLayout.ResumeLayout(false);
            this.mainTableLayout.PerformLayout();
            this.flowLayoutPanel1.ResumeLayout(false);
            this.flowLayoutPanel1.PerformLayout();
            this.flowLayoutPanel2.ResumeLayout(false);
            this.flowLayoutPanel2.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.TableLayoutPanel mainTableLayout;
        private System.Windows.Forms.Label lblSongName;
        private System.Windows.Forms.Label lblSongAuthor;
        private System.Windows.Forms.Label ImgSongType;
        private System.Windows.Forms.Label ImgLike;
        private System.Windows.Forms.Label lblDate;
        private System.Windows.Forms.FlowLayoutPanel flowLayoutPanel1;
        private System.Windows.Forms.FlowLayoutPanel flowLayoutPanel2;
    }
}
