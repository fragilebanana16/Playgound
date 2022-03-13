using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.UI;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;
using Windows.UI.Xaml.Shapes;
using Windows.UI.Xaml.Media.Imaging;
// The Blank Page item template is documented at https://go.microsoft.com/fwlink/?LinkId=402352&clcid=0x409

namespace App1
{
    /// <summary>
    /// An empty page that can be used on its own or navigated to within a Frame. Draw diamond with slider value.
    /// </summary>
    public sealed partial class MainPage : Page
    {
        /// <summary>
        /// Lines count collection
        /// </summary>
        private List<int> prime = new List<int>();
        public MainPage()
        {
            this.InitializeComponent();
            this.slider1.ValueChanged += Slider1_ValueChanged;

            // Even number cost memory
            for (int i = 0; i < 100; i++)
            {
                if (i % 2 != 0)
                {
                    prime.Add(i);
                }
            }
        }

        /// <summary>
        /// Draw logic
        /// </summary>
        /// <param name="polyline"></param>
        /// <param name="number"></param>
        private void DrawDiamond(Polyline polyline, int number)
        {
            int i;
            double t, r = 100;
            List<double> x = new List<double>(new double[100]);
            List<double> y = new List<double>(new double[100]);
            int n = number;
            t = 3.14159 * 2 / n;
            for (i = 0; i < n + 1; i++)
            {

                x[i] = r * Math.Cos(i * t) + 220;
                y[i] = r * Math.Sin(i * t) + 140;
            }

            for (int j = n / 2; j > 0; j--)
            {
                if (n % j != 0 || j == 1)
                {
                    i = (i + j) % n;
                    while (i != 0)
                    {
                        polyline.Points.Add(new Point(x[i], y[i]));
                        i = (i + j) % n;
                    }
                    polyline.Points.Add(new Point(x[i], y[i]));
                }
                else
                {
                    int time = n / j;
                    for (int count = 0; count < j; count++)
                    {
                        for (int k = 0; k < time; k++)
                        {

                            i = (i + j) % n;
                            polyline.Points.Add(new Point(x[i], y[i]));

                        }
                        i = (i + j - 1) % n;
                        polyline.Points.Add(new Point(x[i], y[i]));
                    }
                }
            }
        }

        /// <summary>
        /// Slider value control the polyline display
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void Slider1_ValueChanged(object sender, RangeBaseValueChangedEventArgs e)
        {
            this.polyline1.Points.Clear();
            this.polyline2.Points.Clear();
            this.polyline3.Points.Clear();
            this.polyline4.Points.Clear();
            this.polyline5.Points.Clear();
            this.polyline6.Points.Clear();
            this.polyline7.Points.Clear();
            this.polyline8.Points.Clear();
            this.polyline9.Points.Clear();
            int increment = (int)this.slider1.Value;
            if (increment > 20)
            {
                return;
            }
            DrawDiamond(this.polyline1, prime[increment]);
            DrawDiamond(this.polyline2, prime[increment+1]);
            DrawDiamond(this.polyline3, prime[increment+2]);
            DrawDiamond(this.polyline4, prime[increment+3]);
            DrawDiamond(this.polyline5, prime[increment+4]);
            DrawDiamond(this.polyline6, prime[increment+5]); // 10 is bug
            DrawDiamond(this.polyline7, prime[increment+6]);
            DrawDiamond(this.polyline8, prime[increment+7]);
            DrawDiamond(this.polyline9, prime[increment+8]); // 14 is bug 15 16 17

        }


        /// <summary>
        /// Not used for now
        /// </summary>
        /// <param name="x"></param>
        /// <param name="y"></param>
        /// <param name="Radius"></param>
        /// <param name="brush"></param>
        /// <returns></returns>
        private Shape GenerateEllipse(double x, double y, double Radius, Brush brush)
        {
            Ellipse myEllipse = new Ellipse();
            SolidColorBrush mySolidColorBrush = new SolidColorBrush();
            mySolidColorBrush.Color = Colors.Transparent;
            myEllipse.Fill = mySolidColorBrush;
            myEllipse.StrokeThickness = 5;
            myEllipse.Stroke = brush;
            myEllipse.Width = Radius;
            myEllipse.Height = Radius;
            double left = x - (myEllipse.Width / 2);
            double top = y - (myEllipse.Height / 2);
            myEllipse.Margin = new Thickness(left, top, 0, 0);
            return myEllipse;
        }

                          
        /// <summary>
        /// Play sound by speaker, not used by now
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private async void Button_Click(object sender, RoutedEventArgs e)
        {
            MediaElement mediaElement = new MediaElement();
            var synth = new Windows.Media.SpeechSynthesis.SpeechSynthesizer();
            Windows.Media.SpeechSynthesis.SpeechSynthesisStream stream = await synth.SynthesizeTextToStreamAsync("Hello, World!");
            mediaElement.SetSource(stream, stream.ContentType);
            mediaElement.Play();
        }
    }
}
