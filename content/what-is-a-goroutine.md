---
title: "What is a Goroutine?"
author: Eric Wollesen
date: "2023-06-10"
images:
  - "/img/Go_Lang_Gopher.webp"
toc: true
---


## What Is A Goroutine?

In a nutshell, a goroutine is a thread that's managed by the Go runtime scheduler. 

But if that doesn't make sense, then we need to take a step back, and talk briefly about concurrency and parallelism in computer programs. These are complicated subjects, so we'll use broad strokes here. You'll be able to find some links in the [references section](#references) if you want to read more.

## A Summary of Concurrency and Parallelism

In a computer program, the processor reads each instruction of the program and executes it. Sometimes however, programs need to wait for something external to the processor that's needed for execution of the program. For example, your program may need to load image data from a solid state disk (SSD). Even the fastest SSDs are still far slower than modern processors, so it can be useful to allow the program to execute other parts of the program while it waits for that image data to be loaded from the SSD. Doing so is an example of concurrency, and that's one of the things that having a program with multiple threads (or in our case goroutines) allows us to write into a program.

Parallelism is another great use case for goroutines. Modern processors often have multiple logical execution units, commonly called cores. Each core in a processor is capable of executing a different logical part of a program independently, and at the same time. This is what is known as parallelism. Let's say you're writing a program to organize and display a digital photo album. If the album contains 100 images, and your program needs to create a thumbnail-sized version of each of those images, you can easily imagine that you'd write a for-loop to iterate over each of the 100 images, creating a thumbnail-sized version of each, right? 

{{< highlight go >}}
func createThumbnails(imageFilenames []string) {
    for _, imageFilename := range imageFilenames {
	    createThumbnail(imageFilename)
	}
}
{{</ highlight >}}

With parallelism, you can instruct the program to create each of those thumbnail-sized images in parallel, and the Go runtime scheduler will figure out the best way to make use of the cores available in the processor so that each of them is busy as much as possible. This should divide the time it takes to generate those thumbnail-sized images by the number of available cores in the system. That's the theory, though in reality, programs almost never reach that theoretical speed. They can get close however, and with modern processors having eight or more cores, it can be a real time-saver!

## Goroutine Examples

It's very easy to launch a goroutine. One needs simply us the `go` keyword: 

{{< highlight go >}}
func createThumbnails(imageFilenames []string) {
    for _, imageFilename := range imageFilenames {
	    go createThumbnail(imageFilename)
	}
}
{{</ highlight >}}

For each image in `imageFilenames` a new goroutine will be launched. Each goroutine will begin its execution at the `createThumbnail` function, and each will have a unique image filename from `imageFilenames`.

But is that all there is to it? Probably not. There's a good chance you want to do something else with each thumbnail image once it's created. It would also be a good idea to keep the user informed of the progress of the overall process of creating the thumbnail-sized image copies. Also, what happens if there's an error processing an image in a goroutine? Strategies for each of these situations will come in future lessons.

## Goroutine Gotchas

There are a number of tricky situations that arise due to goroutines in software. What follows is an overview of some of the most common. These gotchas aren't in anyway specific to the Go language, but rather these are common concerns in any language that makes use of concurrency and parallelism.

### Variable Capture

One of the easiest mistakes to make with goroutines, is forgetting to copy variables into the goroutine. Here's an example:

{{< highlight go >}}
for i := 0; i < 10; i++ {
    go func() {
	    fmt.Println("The value of i is", i)
	}()
	time.Sleep(time.Second) // This use of time.Sleep isn't recommended, it's used here to keep the code simpler
}
{{</ highlight >}}

And the output?

{{< output >}}
The value of i is 10
The value of i is 10
The value of i is 10
The value of i is 10
The value of i is 10
The value of i is 10
The value of i is 10
The value of i is 10
The value of i is 10
The value of i is 10
{{</ output >}}

That's probably not what you expected. So what happened? Each of the goroutines was launched, but while the Go runtime guarantees that the goroutines will run, it doesn't make any promises about when they'll start, or in what order. Meanwhile, the main program, that launched the goroutines, continues looping over the `for` loop---launching more goroutines, and incrementing the value stored in `i` in the process. By the time the first goroutine actually started running, the value of `i` was already `10`.

Fortunately, this kind of problem is easy to fix. 

Also, if you're running `go vet` on your code (and you might be [even if you don't realize it](https://pkg.go.dev/cmd/go#hdr-Test_packages)) you should see a warning whenever such a situation is found in your code:

{{< output >}}
./main.go:13:37: loop variable i captured by func literal
{{</ output >}}

So here's a fixed version:

{{< highlight go >}}
for i := 0; i < 10; i++ {
    go func(i2 int) {
        fmt.Println("The value of i is", i2)
    }(i)
    time.Sleep(time.Second) 
}
{{</ highlight >}}

The arguments passed to the function literal with the `go` keyword are evaluated at the same time as the `go` statement itself, and because it's a function call, it's value is copied to the new goroutine's function as an argument, capturing it's current value. Later loop iterations will also have their arguments copied into their function calls, and should then result in output like the following:

{{< output >}}
The value of i is 4
The value of i is 6
The value of i is 7
The value of i is 9
The value of i is 8
The value of i is 0
The value of i is 2
The value of i is 3
The value of i is 1
The value of i is 5
{{</ output >}}

### Go Maps and Thread Safety

Because goroutines are an implementation of threads, they share their memory pool with all of the other goroutines that are a part of the program. That means that memory or data structures modified by one goroutine, can affect other goroutines.

This too is a large topic, that will be covered in its own lesson, but you should be aware that Go's [built-in map type](https://go.dev/blog/maps) is not thread-safe.

The simplest fix is usually to simply wrap all read and write access to the map with a [`sync.Mutex`](https://pkg.go.dev/sync#Mutex). In some cases it might make sense to use the [`sync.Map`](https://pkg.go.dev/sync#Map) type defined in the standard library.

TODO examples with mutex.

### Memory Leaks

TODO talk about leaking goroutines

## Communicating Between Goroutines

TODO talk about using channels to communicate between goroutines

## References

- [A Tour of Go: Concurrency](https://go.dev/tour/concurrency/)
- [Effective Go: Goroutines](https://go.dev/doc/effective_go#goroutines)
- [Thread (computing) @ Wikipedia](https://en.wikipedia.org/wiki/Thread_(computing))
- [Maps are not safe for concurrent use](https://go.dev/doc/faq#atomic_maps)
