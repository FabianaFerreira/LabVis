var diameter = 1600;
var currentYear = (new Date()).getFullYear();

var timeout = 270;

var clickRootCounter = 0;
var margin = {top: 50, right: 120, bottom: 20, left: 120},
    width = diameter,
    height = diameter,
    depth = 0;

var i = 0,
    duration = 350,
    root;

var div = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

var tree = d3.layout.tree()
    .size([360, diameter/8])
    .separation(function(a, b) {
      return (a.parent == b.parent ? 20 : 22) / (a.depth);
    });

var diagonal = d3.svg.diagonal.radial()
    .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

var svg = d3.select("body").append("svg")
    .attr("width", width )
    .attr("margin-left", "auto")
    .attr("margin-right", "auto")
    .attr("height", height )
    .attr ("align", "center")
  .append("g")
    .attr("class", "vis")
    .attr("transform", "translate(" + (diameter / 2 - 100) + "," + (diameter / 2 - 120) + ")")
    .attr ("align", "center");

//Calculates the radius, based on values that have been chosen by the designer
function getRadiusFromAge (d) {
if (d.death)
  var age = (d.death) - (d.born);
else
  var age = currentYear - d.born;
if (age >= 0 && age <= 9)
    return 7;
else if (age >= 10 && age <= 19)
    return 10; //7.2
else if (age >= 20 && age <= 39)
    return 15;//11.5
else if (age >= 40 && age <= 59)
    return 20;//14
else if (age >= 60 && age <= 79)
    return 25; //17
else if (age >= 80 && age <= 100)
    return 45; // 21
else if (currentYear - d.born == 116 && (d.children))
  return 7.2;
else if (currentYear - d.born == 116 && !(d.children))
  return 5;
}

//Generates the line that will be used as "d" attribute of a path, indicating that the person is dead
function getLine (d) {
  var radius = getRadiusFromAge (d);
  line = d3.svg.line.radial()([[-radius,Math.PI/4],[radius,Math.PI/4]]);
  return line;
}

function getParents (d) {
if (d.parent)
    {
      if (d.parent.name != "Casamento")
        parents.push (d.parent);
      getParents (d.parent);
    }
else return 0;
}

function getDistanceSpouses (d) {
var mainRadius = getRadiusFromAge (d);
var spouseRadius = getRadiusFromAge (d.spouse);
var position = {cx:0, cy:0};
if (mainRadius == spouseRadius)
{
  position.cx = (mainRadius-5);
  position.cy = (mainRadius-5);
  return position;
}
else if (mainRadius > spouseRadius)
  {
  position.cx = mainRadius;
  position.cy = mainRadius;
  return position;
}
else if (spouseRadius > mainRadius)
{
  position.cx = mainRadius*0.9;
  position.cy = mainRadius*0.9;
  return position;
}
}

function getRootPosition () {
var position = {
  cx: root.x,
  cy: root.y
};
return position;
}

d3.json("arvore_datas.json", function(error, pubs) {
  if (error) throw error;
    root = pubs;
    root.x0 = height / 2;
    root.y0 = 0;
    root.children.forEach(expand); // start with all children collapsed
    update(root);
    d3.select(self.frameElement).style("height", "800px");

    function update(source) {

      // Compute the new tree layout.
      var nodes = tree.nodes(root),
          links = tree.links(nodes);

      nodes.forEach(function (d) {
        if (d.depth != 0)
          d.y = (d.parent.y + 250/(d.depth));
        else d.y = 0 ;//- 60*(d.depth);
      });

      // Update the nodes…
      var node = svg.selectAll("svg")
          .data(nodes, function(d) {return d.id || (d.id = ++i); });

      //
      //  LINKS
      //
      var link = svg.selectAll("path.link")
          .data(links, function (d) { return d.target.id; });
      // Enter any new links at the parent's previous position.
      link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
              if (d.source == root)
              {
                svg.insert("path", ".vis")
                  .attr("class", "Linelink")
                  .attr("d", function () {
                    var line = d3.svg.line.radial()([[d.source.y, d.source.x / 180*Math.PI], [d.source.y, d.source.x / 180*Math.PI]]);
                      return line;

                  })
              }
              else if (d.target != root)
              {
                  var o = {x: source.x0, y: source.y0};
                  var diagonal = d3.svg.diagonal.radial()
                    .projection(function () { return [d.y, d.x / 180 * Math.PI]; });
                  return diagonal({source: o, target: o});
              }

            });

      // Transition links to their new position.
      link.transition()
          .duration(duration)
          .attr("d", diagonal);

      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
          .duration(duration)
          .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
          })
          .remove();

      // Stash the old positions for transition.
      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      //
      //  WHITE CIRCLE
      //

      //Adding a white circle behind the root
      svg
        .append ("circle")
        .attr("class", "whiteCircle")
        .attr ("cx",  -1)
        .attr("cy", 10)
        .attr("r", function () {
          var spouseRadius = getRadiusFromAge(root.spouse);
          var rootRadius = getRadiusFromAge(root);
          return spouseRadius + rootRadius;
        })


      //
      //  EX-SPOUSES
      //
      var nodeEnter = node.enter().append("g")
          .attr("class", "node")
          .on("click", function (d) {return click (d)});

      nodeEnter.filter (function (d,i) {return d.exSpouse != undefined})
        .append ("g")
        .attr("class", "exSpouse")
        .append ("circle")
          .attr ("cx", function (d) {
              var theta = d.x;
              var mainRadius = getRadiusFromAge (d);
              var spouseRadius = getRadiusFromAge (d.exSpouse);
              if (theta > 90 && theta < 270)
              {
                if (mainRadius == spouseRadius)
                  return (mainRadius-10);

                else if (mainRadius > spouseRadius)
                  return mainRadius*0.6;

                else if (spouseRadius > mainRadius)
                  return mainRadius*0.9;
              }
              else if ((theta > 270 && theta < 360) || (theta > 0 && theta < 90))
              {
                if (mainRadius == spouseRadius)
                  return (mainRadius-11);

                else if (mainRadius > spouseRadius)
                  return mainRadius - 9;

                else if (spouseRadius > mainRadius)
                  return mainRadius*0.9;
              }

            })
          .attr ("cy", function (d) {
                var theta = d.x;
                var mainRadius = getRadiusFromAge (d);
                var spouseRadius = getRadiusFromAge (d.exSpouse);
                if (theta > 90 && theta < 270)
                {
                  if (mainRadius == spouseRadius)
                    return (mainRadius-40);
                  else if (mainRadius > spouseRadius)
                   return mainRadius*0.5;
                  else if (spouseRadius > mainRadius)
                    return mainRadius*0.9;
                }
                else if ((theta > 270 && theta < 360) || (theta > 0 && theta < 90))
                {
                  if (mainRadius == spouseRadius)
                    return (mainRadius-30);
                  else if (mainRadius > spouseRadius)
                   return mainRadius*0.5 -25;
                  else if (spouseRadius > mainRadius)
                    return mainRadius*0.9;
                }
            })
          .attr ("r", function (d) {return getRadiusFromAge (d.exSpouse)})
            .style ("fill", function (d) {
              if (d.exSpouse.sex == "feminino") return femaleSpouseColor;//"#ff16cc"
              else if (d.exSpouse.sex == "masculino") return maleSpouseColor;

            })
            .style ("stroke", function (d){
              if (d.exSpouse.death)
                return "#ffffff";
              else
                return "#000000";
            });

        //
        //   EX-SPOUSES' LINES
        //

        svg.selectAll(".exSpouse")
        .filter (function (d) {return (d.exSpouse != undefined && d.exSpouse.death)})
        .append("g")
          .attr("class", "exSpouseDeath")
          .append ("path")
            .attr("d", function (d) {
              return getLine(d.exSpouse); });

        svg.selectAll(".node")
          .selectAll(".exSpouseDeath")
          .attr("transform", function (d) {
            var mainRadius = getRadiusFromAge (d);
            var spouseRadius = getRadiusFromAge (d.exSpouse);
            var positionX;
            var positionY;
            var transform;
            var theta = d.x;

            //Getting cx and cy
            if (theta > 90 && theta < 270)
            {
              if (mainRadius == spouseRadius)
              {
                positionX = (mainRadius-11);
                positionY = (mainRadius-30);
              }

              else if (mainRadius > spouseRadius)
              {
                positionX = mainRadius*0.6;
                positionY = mainRadius*0.5;
              }

              else if (spouseRadius > mainRadius)
              {
                positionX = mainRadius*0.9;
                positionY = mainRadius*0.9;
              }
            }
            else if ((theta > 270 && theta < 360) || (theta > 0 && theta < 90))
            {
              if (mainRadius == spouseRadius)
              {
                positionX = (mainRadius-11);
                positionY = mainRadius-30;
              }
              else if (mainRadius > spouseRadius)
              {
                positionX = mainRadius - 9;
                positionY = mainRadius*0.5 -25;
              }

              else if (spouseRadius > mainRadius)
              {
                positionX = mainRadius*0.9;
                positionY = mainRadius*0.9
              }
            }

            if (d == root)
                transform = "translate(" + (positionX + 8) + "," + (positionY - 12) + ")" + "rotate (10)";

            else if ((theta > 180) && (theta < 270))
                transform = "translate(" + (positionX) + "," + (positionY) + ")"
                            + "rotate (" + (90 - (theta - 180)) + ")";

            else if ((theta > 270) && (theta < 360))
                transform = "translate(" + (positionX) + "," + (positionY) + ")"
                            + "rotate (" + ((360 - theta) - 90) + ")";

            else  if ((theta > 0) && (theta < 180))
                transform = "translate(" + (positionX) + "," + (positionY) + ")"
                            + "rotate (" + (90 - theta) + ")";

            return transform;

        });

      //
      //              SPOUSES
      //
      //Spouses: circles near to nodes
      nodeEnter.filter(function (d,i) {return d.spouse != undefined;})
          .append("g")
          .attr("class", "spouse")
          .append("circle")
            .attr ("cx", function (d) {
              var mainRadius = getRadiusFromAge (d);
              var spouseRadius = getRadiusFromAge (d.spouse);
              if (mainRadius == spouseRadius)
                {
                    if (d.spouse.name == "Stephen Weinstein")
                      return (mainRadius-15);

                    return (mainRadius-12);
                }

              else if (spouseRadius < mainRadius)
                return mainRadius*0.5 - 2;

              else if (spouseRadius > mainRadius)
                  return mainRadius - 6; //-8
            })
            .attr ("cy", function (d) {
                var mainRadius = getRadiusFromAge (d);
                var spouseRadius = getRadiusFromAge (d.spouse);
                if (mainRadius == spouseRadius)
                {
                    if (d.spouse.name == "Stephen Weinstein")
                        return (mainRadius*0.8 + 5);
                    return (mainRadius*0.8 + 2);
                }
                else if (spouseRadius < mainRadius)
                 return mainRadius*0.9 - 2;
                else if (spouseRadius > mainRadius)
                {
                  if (d.spouse.name == "Sarah (Sarita) Averbuch Vainer")
                      return mainRadius*0.8 + 30;
                  return mainRadius*0.8 + 2; //5

                }
            })
            .attr ("r", function (d) {return getRadiusFromAge (d.spouse)})
            .style ("fill", function (d) {
              if (d.spouse.sex == "feminino") return femaleSpouseColor;//"#ff16cc"
              else if (d.spouse.sex == "masculino") return maleSpouseColor;
            })
            .style ("stroke", function (d) {
              if (d.spouse.death)
                return "#ffffff";
              else if (!d.spouse.death)
                return "#000000";
            })
            //Translating the position of root's spouse due to the white circle behind them
            .attr("transform", function (d) {
              if (d == root)
                return "translate(2.3,-14)";//(positionX + 8) + "," + (positionY - 12)
            });

      //
      //  SPOUSES' LINES
      //

      //Lines that define when a person has already died
      svg.selectAll(".spouse")
        .filter (function (d) {return (d.spouse != undefined && d.spouse.death)})
        .append("g")
          .attr("class", "spouseDeath")
          .append ("path")
            .attr("d", function (d) {
              return getLine(d.spouse); });



      svg.selectAll(".node")
        .selectAll(".spouseDeath")
        .attr("transform", function (d) {
          var mainRadius = getRadiusFromAge (d);
          var spouseRadius = getRadiusFromAge (d.spouse);
          var positionX;
          var positionY;
          var transform;
          var theta = d.x;

          //Getting cx
          if (mainRadius == spouseRadius)
          {
            positionX =  (mainRadius-12);
            positionY = (mainRadius*0.8 + 2);
          }

          else if (spouseRadius < mainRadius)
          {
            positionX =  (mainRadius*0.5 - 2);
            positionY = (mainRadius*0.9 - 2);
          }

          else if (spouseRadius > mainRadius)
          {
            if (d.spouse.name == "Sarah (Sarita) Averbuch Vainer")
              positionY =  mainRadius*0.8 + 30;
            else
              positionY = (mainRadius*0.8 + 2);
            positionX = (mainRadius - 6);

          }

          if (d == root)
              transform = "translate(" + (positionX + 2.3) + "," + (positionY -14) + ")" + "rotate (10)";

          else if ((theta > 180) && (theta < 270))
              transform = "translate(" + (positionX) + "," + (positionY) + ")"
                          + "rotate (" + (90 - (theta - 180)) + ")";

          else if ((theta > 270) && (theta < 360))
              transform = "translate(" + (positionX) + "," + (positionY) + ")"
                          + "rotate (" + ((360 - theta) - 90) + ")";

          else  if ((theta > 0) && (theta < 180))
              transform = "translate(" + (positionX) + "," + (positionY) + ")"
                          + "rotate (" + (90 - theta) + ")";

          return transform;

      });



      //
      //       MARRIAGES
      //
      // Marriages: squares

      nodeEnter.filter (function (d,i) {return d.name == "Casamento"})
        .append ("path")
          .attr("d", d3.svg.symbol().type("square"))
          .attr("fill", "#ccc");

      //
      //  NODES
      //

      nodeEnter.filter (function (d,i) {return d.name != "Casamento"})
      .append("circle")
          .attr ("class", "nodes")
          .attr("r", function (d) {
            return getRadiusFromAge(d);
          })
          .style("fill", function(d) {
              if (d.name == "Casamento") return "#000000";
              if (d.sex == "feminino") return femaleColor;//ff16cc
              else if (d.sex == "masculino") return maleColor;
           })
          .style ("stroke", function (d) {
            if (d.death)
              return "#ffffff";
            else
              return "#000000";
          })
          .attr("transform", function (d) {
            if (d == root)
              return "translate(-47.4,-8)";
          });
      //Lines that define when a person has already died
      svg.selectAll(".node")
        .filter (function (d) {return (d.death && d != undefined)})
        .append("g")
          .attr("class", "death")
          .append ("path")
            .attr("d", function (d) {
              return getLine(d); })
            .attr("transform", function (d) {
                theta = d.x;
                if (d == root)
                    return "translate(-47.4,-8)rotate (10)"
                if ((theta > 180) && (theta < 270))
                  return "rotate (" + (90 - (theta - 180)) + ")";
                if ((theta > 270) && (theta > 360))
                  return "rotate (" + ((360 - theta) - 90) + ")";
                return "rotate (" + (90 - theta) + ")";
            });
        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function (d) {
          //Fixing root position
          if (d == root)
            return ("rotate(" + (d.x - 200) + ")translate(0," + 10 + ")");
          if (d.x == 1) {
              return ("rotate(" + (d.x - 200) + ")translate(" + d.y + ")");
          }
          return ("rotate(" + (d.x - 90) + ")translate(" + d.y + ")"); })

      nodeUpdate.filter (function (d) { d3.select(this).attr ("class") != "spouse"})
          .select("circle")
          .attr("r",  function (d) { return getRadiusFromAge (d);})
          .style("fill", function (d) {
              if (d.name == "Casamento") return "#000000";
              if (d.sex == "feminino") return femaleColor;
              else if (d.sex == "masculino") return maleColor;
           });
      // TODO: appropriate transform
      var nodeExit = node.exit().transition()
          .duration(duration)
          .remove();
      nodeExit.select("circle")
          .attr("r", function (d) {
            getRadiusFromAge(d);
          });


      //
      //  TOOLTIPS
      //
      svg.selectAll("g").selectAll(".nodes")
        .on("mouseover", function (d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(function () {
            if (d.death)
              return (" " + d.name + " <br/>"
                      + " " + d.born + " - " + d.death + " <br/>")
            return (" " + d.name + " <br/>"
                    + " " + d.born + " <br/>")
            })
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 30) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(300)
                .style("opacity", 0);
        });
      svg.selectAll("g").selectAll(".spouse")
      .on("mouseover", function (d) {
          div.transition()
              .duration(200)
              .style("opacity", .9);
          div.html(function () {
            if (d.spouse.death)
              return ( " " +  d.spouse.name + " <br/>"
                        + " " + d.spouse.born + " - " + d.spouse.death + " <br/>")
            return (" " + d.spouse.name + " <br/>"
                    + " " + d.spouse.born + " <br/>")
          })
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY - 30) + "px")
          .style ("tooltip-height", function () {
            if (d.spouse.death)
              return 50 + 15;
            return 50;
          });
      })
      .on("mouseout", function (d) {
          div.transition()
              .duration(300)
              .style("opacity", 0);
      });

      svg.selectAll("g").selectAll(".exSpouse")
      .on("mouseover", function (d) {
          div.transition()
              .duration(200)
              .style("opacity", .9);
          div.html(function () {
            if (d.exSpouse.death)
              return ( " " +  d.exSpouse.name + " <br/>"
                        + " " + d.exSpouse.born + " - " + d.exSpouse.death + " <br/>")
            return (" " + d.exSpouse.name + " <br/>"
                    + " " + d.exSpouse.born + " <br/>")
          })
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY - 30) + "px")
          .style ("tooltip-height", function () {
            if (d.exSpouse.death)
              return 50 + 15;
            return 50;
          });
      })
      .on("mouseout", function (d) {
          div.transition()
              .duration(300)
              .style("opacity", 0);
      });

    } /*function update*/


    function updateSecondPart(source, parents) {
      svg.selectAll ("g")
          .remove();
      svg.selectAll(".nodes")
          .remove();
      svg.selectAll(".spouse")
          .remove();
      svg.selectAll(".death")
          .remove();
      svg.selectAll(".spouseDeath")
          .remove();
      svg.selectAll(".whiteCircle")
          .remove();

      var subTree = d3.layout.tree()
        .size([180, diameter / 2 - 80])
        .separation(function(a, b) { return (a.parent == b.parent ? 5 : 7) / Math.max(1, a.depth); });

      // Compute the new tree layout.
      var nodes = subTree.nodes(source),
          links = subTree.links(nodes);

      var parentsCircles = svg.selectAll("circles")
        .data(parents);

      nodes.forEach(function (d) {
        if (d.depth != 0)
          d.y = (d.parent.y + 250/(d.depth));
        else d.y = 0 ;//- 60*(d.depth);
      });

      parentsCircles.enter()
         // .append("g")
         // .attr("class", "parents")
          .append ("circle")
          .attr("class", "parents")
          .attr("r", function (d) { return getRadiusFromAge (d);})
          .attr ("cx", 0)
          .attr ("cy", function (d,i) { return (-100/(parents.length))*(i+1)})
          .style("fill", function(d) {
              if (d.sex == "feminino") return femaleColor;
              else if (d.sex == "masculino") return maleColor;
           })
          .on ("click", function (d) {return click (d)});

      parentsCircles
        .transition ()
          .duration(duration)
          .attr("transform", function (d,i) { return "translate(" + 0 + "," + (- 200/(parents.length))*(i+1) +")"; });

      parentsCircles
        .exit()
          .transition()
          .duration(duration)
          .remove();

      // Normalize for fixed-depth.
      nodes.forEach(function(d) { d.y = d.depth * 80; });
      // Update the nodes…
      var node = svg.selectAll("g")
          .data(nodes, function (d) { return d.id || (d.id = ++i); });
      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append("g")
          .attr("class", "node")
           .on("click", function (d) { return click (d)});

      //Spouses: circles near to nodes
      nodeEnter.filter(function (d,i) {return d.spouse != undefined;})
          .append("circle")
          .attr ("class", "spouse")
            .attr ("cx", function (d) {
              var mainRadius = getRadiusFromAge (d);
              var spouseRadius = getRadiusFromAge (d.spouse);
              if (mainRadius == spouseRadius)
                return (mainRadius-10);

              else if (spouseRadius < mainRadius)
                return mainRadius*0.5 - 4;

              else if (spouseRadius > mainRadius)
                return mainRadius - 5;
            })
            .attr ("cy", function (d) {
                var mainRadius = getRadiusFromAge (d);
                var spouseRadius = getRadiusFromAge (d.spouse);
                if (mainRadius == spouseRadius)
                  return (mainRadius*0.8-2);
                else if (spouseRadius < mainRadius)
                 return mainRadius*0.9 - 2;
                else if (spouseRadius > mainRadius)
                  return mainRadius*0.8 + 3;
            })
            .attr ("r", function (d) { return getRadiusFromAge (d.spouse)})
            .style ("fill", function (d) {
              if (d.spouse.sex == "feminino") return femaleSpouseColor;
              else if (d.spouse.sex == "masculino") return maleSpouseColor;
            })
            .style ("stroke", function (d){
              if (d.spouse.death)
                return "#ffffff";
              else
                return "#000000";
            });

    //TESTE

    //Lines that define when a person has already died
    svg.selectAll(".node")
      .filter (function (d) {return (d.spouse != undefined && d.spouse.death)})
      .append("g")
        .attr("class", "spouseDeath")
        .append ("path")
          .attr("d", function (d) {
            return getLine(d.spouse); });

    svg.selectAll(".spouseDeath")
     // .selectAll(".spouseDeath")
      .attr("transform", function (d) {
        var mainRadius = getRadiusFromAge (d);
        var spouseRadius = getRadiusFromAge (d.spouse);
        var positionX;
        var positionY;
        var transform;

        //Getting cx
        if (mainRadius == spouseRadius)
          positionX =  (mainRadius-10);
        else if (spouseRadius < mainRadius)
          positionX =  mainRadius*0.5 - 4;
        else if (spouseRadius > mainRadius)
          positionX =  mainRadius - 5;

        //Getting cy
        if (mainRadius == spouseRadius)
          positionY = (mainRadius*0.8-2);
        else if (spouseRadius < mainRadius)
          positionY = mainRadius*0.9 - 2;
        else if (spouseRadius > mainRadius)
          positionY = mainRadius*0.8 + 3;

        theta = d.x;
        if (d == root)
            transform = "translate(" + positionX + "," + positionY + ")" + "rotate (10)";

        else if ((theta > 180) && (theta < 270))
            transform = "translate(" + (positionX) + "," + (positionY) + ")"
                        + "rotate (" + (/*90*/ - (theta - 180)) + ")";


        else if ((theta > 270) && (theta < 360))
            transform = "translate(" + (positionX) + "," + (positionY) + ")"
                        + "rotate (" + ((360 - theta) - 90) + ")";


        else  if ((theta > 0) && (theta < 180))
            transform = "translate(" + (positionX) + "," + (positionY) + ")"
                        + "rotate (" + (/*90*/ - theta) + ")";

        return transform;

      });


      nodeEnter.filter (function (d,i) {return d.name == "Casamento"})
        .append ("path")
          .attr("d", d3.svg.symbol().type("square"))
          .attr("fill", "#ccc");
      nodeEnter.filter (function (d,i) {return d.name != "Casamento"})
        .append("circle")
          .attr ("class", "nodes")
          .attr("r", function (d) {
            return getRadiusFromAge (d);})
          .style("fill", function(d) {
            if (d.name == "Casamento") return "#000000";
            if (d.sex == "feminino") return femaleColor;
            else if (d.sex == "masculino") return maleColor;
         })
          .style ("stroke", function (d){
              if (d.death)
                return "#ffffff";
              else
                return "#000000";
            });

      //Lines that define when a person has already died
      nodeEnter.filter(function (d,i) {return d != undefined && d.death})
        .append("g")
          .attr("class", "death")
          .append ("path")
            .attr("d", function (d) { return getLine(d); })
            .attr("transform", function (d) {
                theta = d.x;
                if (d.name == "Maria (Maine) Feldman")
                    return "rotate (20)"
                if ((theta > 180) && (theta < 270))
                  return "rotate (" + (90 - (theta - 180)) + ")";
                if ((theta > 270) && (theta > 360))
                  return "rotate (" + ((360 - theta) - 90) + ")";
                return "rotate (" + (/*90 -*/- theta) + ")";
            });

      // Transition nodes to their new position.
      var nodeUpdate = node.transition()
          .duration(duration)
          .attr("transform", function (d) {
              if (d.x == 1) {
                  return ("rotate(" + (d.x - 200) + ")translate(" + d.y + ")");
              }
              return ("rotate(" + (d.x - 360) + ")translate(" + d.y + ")"); })
      nodeUpdate.selectAll(".node")//.filter (function (d) { d3.select(this).attr ("class") == "node"})
          .select("circle")
          .attr("r",  function (d) { return getRadiusFromAge (d); })
          .style("fill", function (d) {
              if (d.sex == "feminino") return femaleColor;
              else if (d.sex == "masculino") return maleColor;
           });
      nodeUpdate.selectAll(".spouse")//.filter (function (d) { d3.select(this).attr ("class") == "spouse"})
          .select("circle")
          .attr("r",  function (d) { return getRadiusFromAge (d); })
          .attr ("cx", function (d) {
              //ANGLE
              var mainRadius = getRadiusFromAge (d);
              var spouseRadius = getRadiusFromAge (d.spouse);
              if (mainRadius == spouseRadius)
                return (mainRadius-10);

              else if (spouseRadius < mainRadius)
                return mainRadius*0.5 - 4;

              else if (spouseRadius > mainRadius)
                return mainRadius - 8;
            })
            .attr ("cy", function (d) {
              //RADIUS
                var mainRadius = getRadiusFromAge (d);
                var spouseRadius = getRadiusFromAge (d.spouse);
                if (mainRadius == spouseRadius)
                  return (mainRadius*0.8-2);
                else if (spouseRadius < mainRadius)
                 return mainRadius*0.9 - 2;
                else if (spouseRadius > mainRadius)
                  return mainRadius*0.8 + 5;
            })
          .style("fill", function (d) {
              if (d.spouse.sex == "feminino") return femaleSpouseColor;
              else if (d.spouse.sex == "masculino") return maleSpouseColor;
           });

      // TODO: appropriate transform
      var nodeExit = node.exit().transition()
          .duration(duration)
          .remove();
      nodeExit.select("circle")
         .attr("r", function (d) { return getRadiusFromAge (d); });
      // Update the links…
      var link = svg.selectAll("path.link")
          .data(links, function (d) { return d.target.id; });
      // Enter any new links at the parent's previous position.
      link.enter().insert("path", "g")
          .attr("class", "link")
          .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
          });
      // Transition links to their new position.
      link.transition()
          .duration(duration)
          .attr ("transform", function (d) {return "rotate (90)"})
          .attr("d", diagonal);
      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
          .duration(duration)
          .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
          })
          .remove();
      // Stash the old positions for transition.
      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      svg.selectAll("g").selectAll(".nodes")
        .on("mouseover", function (d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(function () {
            if (d.death)
              return (" " + d.name + " <br/>"
                      + " " + d.born + " - " + d.death + " <br/>")
            return (" " + d.name + " <br/>"
                    + " "+ d.born + " <br/>")
            })
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 30) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(300)
                .style("opacity", 0);
        });

      svg.selectAll(".spouse")
      .on("mouseover", function (d) {
          div.transition()
              .duration(200)
              .style("opacity", .9);
          div.html(function () {
            if (d.spouse.death)
              return ( " " +  d.spouse.name + " <br/>"
                        + " " + d.spouse.born + " - " + d.spouse.death + " <br/>")
            return (" " + d.spouse.name + " <br/>"
                    + " " + d.spouse.born + " <br/>")
          })
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY - 30) + "px")
          .style ("tooltip-height", function () {
            if (d.spouse.death)
              return 50 + 15;
            return 50;
          });
      })
      .on("mouseout", function (d) {
          div.transition()
              .duration(300)
              .style("opacity", 0);
      });
      svg.selectAll(".parents")
      .on("mouseover", function (d) {
          div.transition()
              .duration(200)
              .style("opacity", .9);
          div.html(function () {
            if (d.death)
              return ( " " +  d.name + " <br/>"
                        + " " + d.born + " - " + d.death + " <br/>")
            return (" " + d.name + " " + "<br/>"
                    + " " +  d.born + " <br/>")
          })
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY - 30) + "px")
          .style ("tooltip-height", function () {
            if (d.death)
              return 50 + 15;
            return 50;
          });
      })
      .on("mouseout", function (d) {
          div.transition()
              .duration(300)
              .style("opacity", 0);
      });


      svg.selectAll(".spouseDeath")
      .on("mouseover", function (d) {
          div.transition()
              .duration(200)
              .style("opacity", .9);
          div.html(function () {
            if (d.spouse.death)
              return ( " " +  d.spouse.name + " <br/>"
                        + " " + d.spouse.born + " - " + d.spouse.death + " <br/>")
            return (" " + d.spouse.name + " <br/>"
                    + " " + d.spouse.born + " <br/>")
          })
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY - 30) + "px")
          .style ("tooltip-height", function () {
            if (d.spouse.death)
              return 50 + 15;
            return 50;
          });
      })
      .on("mouseout", function (d) {
          div.transition()
              .duration(300)
              .style("opacity", 0);
      });
      svg.selectAll(".parents")
      .on("mouseover", function (d) {
          div.transition()
              .duration(200)
              .style("opacity", .9);
          div.html(function () {
            if (d.death)
              return ( " " +  d.name + " " + "<br/>"
                        + " " + d.born + " - " + d.death + " <br/>")
            return (" " + d.name + " <br/>"
                    + " " + d.born + " <br/>")
          })
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY - 30) + "px")
          .style ("tooltip-height", function () {
            if (d.death)
              return 50 + 15;
            return 50;
          });
      })
      .on("mouseout", function (d) {
          div.transition()
              .duration(300)
              .style("opacity", 0);
      });

   } /*function updateSecondPart*/

    // Toggle children on click.
    function click(d) {

      div
        .style("visibility", "hidden");

      svg.on("mousemove", function () {return div.style("visibility", "visible")});

      d3.selectAll ("line").remove();

      nos = [];
      parents = [];
      getParents (d);

      if (d.name == "Maria (Maine) Feldman") {
        clickRootCounter += 1;
        if (clickRootCounter != 0) {
          d3.selectAll("circle")
            .filter (function () {return d3.select(this).attr ("class") == "parents"})
            .remove();
          svg.selectAll(".node")
            .transition()
            .duration(0)
            .attr("transform", "translate(1000,1000)")
            .remove();
          svg.selectAll(".parentsDeath")
            .transition()
            .duration(0)
            .attr("transform", "translate(1000,1000)")
            .remove();
          d3.selectAll("path.link").remove();
          clickRootCounter += 1;
          update(d);
        }
      }
      else {
        d3.selectAll("circle")
            .filter (function () {return d3.select(this).attr ("class") == "parents"})
            .remove();
        var radius = getRadiusFromAge (d);

        var line = svg.append("line")
            .attr("x1", 0)
            .attr("y1", function () { return (- radius)})
            .attr("x2", 0)
            .attr("y2", -304);
        line
          .attr ("stroke-width", 1.5)
          .attr ("stroke", "#ccc");

        svg.selectAll(".node")
            .transition()
            .duration(0)
            .attr("transform", "translate(1000,1000)")
            .remove();

        d3.selectAll("path.link").remove();

        updateSecondPart (d, parents);

        //Waiting 0.28s to run this part of the code
        setTimeout (function () {
            var deadParents = [];
            svg.selectAll(".parents")
              .filter(function (d) { return d != undefined && d.death})
              .each (function (d,i) {
                svg
                  .append("g")
                  .attr("class", "parentsDeath")

                  .append("path")
                  .attr("d", function () {
                    if (d.death)
                      deadParents.push(i);
                      return getLine(d);
                  })
                svg.selectAll(".parentsDeath")
                  .each(function (d,i) {
                    d3.select(this)
                      .attr("transform", function () {
                        var positionY = (-200/(parents.length))*(1 + parents.length - (deadParents.length - deadParents[i]));
                        return ("translate(0," + positionY*1.5 + ")")
                      })

                    })
                });
        }, timeout);



      } /*else*/
    }
    // Collapse nodes
    function collapse(d) {
      if (d.children) {
          d._children = d.children;
          d._children.forEach(collapse);
          d.children = null;
        }
    }
    function expand(d){
      var children = (d.children)?d.children:d._children;
      if (d._children) {
          d.children = d._children;
          d._children = null;
      }
      if(children)
        children.forEach(expand);
    }
});
