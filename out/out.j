.class public Main
.super java/lang/Object

; construtor padrão
.method public <init>()V
  aload_0
  invokespecial java/lang/Object/<init>()V
  return
.end method

; método main
.method public static main([Ljava/lang/String;)V
  .limit stack 100
  .limit locals 4

  bipush 5
  newarray int
  dup
  bipush 0
  bipush 10
  iastore
  dup
  bipush 1
  bipush 20
  iastore
  dup
  bipush 2
  bipush 30
  iastore
  dup
  bipush 3
  bipush 40
  iastore
  dup
  bipush 4
  bipush 50
  iastore
  astore 1
  getstatic java/lang/System/out Ljava/io/PrintStream;
  aload 1
  iconst_0
  iaload
  invokevirtual java/io/PrintStream/println(I)V
  getstatic java/lang/System/out Ljava/io/PrintStream;
  aload 1
  iconst_2
  iaload
  invokevirtual java/io/PrintStream/println(I)V
  getstatic java/lang/System/out Ljava/io/PrintStream;
  aload 1
  iconst_4
  iaload
  invokevirtual java/io/PrintStream/println(I)V
  iconst_0
  istore 2
  iconst_0
  istore 3
FOR0:
  iload 3
  iconst_5
  if_icmpge ENDFOR1
  iload 2
  aload 1
  iload 3
  iaload
  iadd
  istore 2
  iload 3
  iconst_1
  iadd
  istore 3
  goto FOR0
ENDFOR1:
  getstatic java/lang/System/out Ljava/io/PrintStream;
  iload 2
  invokevirtual java/io/PrintStream/println(I)V

  return
.end method
